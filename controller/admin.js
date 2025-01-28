const usermodel = require('../models/usermodel')
const adminSchema = require('../models/adminmodel')
const bcrypt= require('bcrypt')
const categoryModel=require('../models/categories')
const productModel = require('../models/product')
const fs = require('fs').promises; // Import the promises version of fs
const path = require('path');

const Loadlogin = async (req, res) => {
    try {
        const oldAdm = await adminSchema.findOne({ email: 'admin@gmail.com' });
        if (!oldAdm) {
            const hashedPassword = await bcrypt.hash('1234', 10);
            const admin = new adminSchema({
                email: 'admin@gmail.com',
                password: hashedPassword
            });
            console.log(admin);
            
            await admin.save();
            console.log('Admin created successfully');
        }
        // Pass an empty message or null if no message is needed
        res.render('admin/login', { message: null });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).send('Something went wrong while creating the admin.');
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await adminSchema.findOne({ email });

        if (!admin) {
            return res.render("admin/login", { message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.render("admin/login", { message: "Invalid credentials" });
        }

        // Set the session variable after login
        req.session.admin = true;
        console.log(req.session); // Check session after setting

        res.redirect("/admin/dashboard");
    } catch (error) {
        res.send(error);
    }
};



const Loddashbord = async (req, res) => {
    try {
        const admin = req.session.admin
        if (!admin) return res.redirect('/admin/login')

        const searchQuery = req.query.search || ""

        let users = [];  // Initialize users as an empty array

        if (searchQuery) {
            users = await usermodel
                .find({
                    email: { $regex: searchQuery, $options: 'i' },
                })
                .exec()
        } else {
            users = await usermodel.find({}).exec()  // Fetch all users if no search query
        }

        // Map through the users only if the array is not empty
        const usersWithIndex = users.map((user, index) => {
            const userObject = user.toObject();
            userObject.originalIndex = index + 1
            return userObject;
        })

        res.render('admin/dashbord', {
            users: usersWithIndex,  // Send the modified users list
            searchQuery: searchQuery,
        })

    } catch (error) {
        console.error('Error while fetching dashboard users:', error);
        res.render('admin/login', { message: 'Failed to load dashboard' })
    }
}

      
const Loadusers = async (req,res)=>{
    try {
        const users = await usermodel.find()
        res.render('admin/adminUser',{users})
    } catch (error) {
        res.status(500).send('server error')
        
    }
}




const LoadProducts = async (req, res) => {
    try {
      const products = await productModel.find()  // Fetch all products
        .populate('category','name');  // Populate category name
      res.render('admin/products', { products });
    } catch (error) {
      console.error('Error loading products:', error);
      res.render('admin/login', { message: 'Failed to load products' });
    }
  };
  
const renderAddProduct = async (req, res) => {
    try {
        const categories = await categoryModel.find({}); 
        res.render('admin/addproducts', { categories });
    } catch (error) {
        console.error('Error while fetching categories:', error);
        res.render('admin/addproducts');
    }
};



const addProduct = async (req, res) => {
    const { image1, image2, image3, image4, productName } = req.body;

    // Array to store the paths of saved images
    const savedImagePaths = [];

    console.log('jdfhgujcbhi');

    const saveBase64ToFile = async (base64Data, filename) => {
        // Extract the base64 data from the string (if it contains header data)
        const matches = base64Data.match(/^data:image\/(png|jpg|jpeg);base64,(.+)$/);
        if (!matches) {
            return false; // Invalid base64 format
        }

        const imageBuffer = Buffer.from(matches[2], 'base64');
        const productname = productName.trim().replace(/\s+/g, '');
        // Specify the relative path where images should be saved
        const filePath = path.join('public', 'images', productname, filename);

        



        // Ensure the directory exists, or create it if not
        const dirPath = path.dirname(filePath);
        try {
            await fs.access(dirPath); // Check if directory exists
        } catch (error) {
            await fs.mkdir(dirPath, { recursive: true }); // Create directory if it doesn't exist
        }

        // Write the image file to the path
        await fs.writeFile(filePath, imageBuffer);

        // Return the relative file path
        return `images/${productname}/${filename}`;
    };

    // Save each image if base64 data is provided and store the path
    try {
        if (image1) {
            const savedPath = await saveBase64ToFile(image1, 'image1.png');
            if (savedPath) {
                savedImagePaths.push(savedPath);
                console.log('image1 saved:', savedPath);
            }
        }
        if (image2) {
            const savedPath = await saveBase64ToFile(image2, 'image2.png');
            if (savedPath) {
                savedImagePaths.push(savedPath);
                console.log('image2 saved:', savedPath);
            }
        }
        if (image3) {
            const savedPath = await saveBase64ToFile(image3, 'image3.png');
            if (savedPath) {
                savedImagePaths.push(savedPath);
                console.log('image3 saved:', savedPath);
            }
        }
        if (image4) {
            const savedPath = await saveBase64ToFile(image4, 'image4.png');
            if (savedPath) {
                savedImagePaths.push(savedPath);
                console.log('image4 saved:', savedPath);
            }
        }

        // Remove base64 images from req.body
        delete req.body.image1;
        delete req.body.image2;
        delete req.body.image3;
        delete req.body.image4;

        // Add the saved image paths array to req.body
        req.body.imagePaths = savedImagePaths;

        // Log the updated req.body (without base64 data)
        console.log('Updated req.body:', req.body);

        if (req.body.color) {
            req.body.color = req.body.color.split(",").map(c => c.trim());
        }
        const  newProduct = new productModel(req.body);
        await newProduct.save();

        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error saving product:', error);
        res.status(500).send('Error saving product');
    }
};



// Load categories and display them on the management page
const LoadCategory = async (req, res) => {
    try {
        const admin = req.session.admin;
        if (!admin) return res.redirect('/admin/login');

        const categories = await categoryModel.find({});
        res.render('admin/categories', { categories});
    } catch (error) {
        console.error('Error loading categories:', error);
        res.render('admin/dashbord', { message: 'Failed to load categories' });
    }
};

const postAddCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        // Check for missing fields
        if (!name || !description) {
            return res.render('admin/addcategories', { error: 'Category name and description are required' });
        }

        // Check for duplicate category name
        const existingCategory = await categoryModel.findOne({ name });
        if (existingCategory) {
            return res.render('admin/addcategories', { error: 'Category name already exists' });
        }

        // Save the new category
        const newCategory = new categoryModel({ name, description });
        await newCategory.save();

        res.redirect('/admin/categories');
    } catch (error) {
        console.error('Error adding category:', error);
        res.render('admin/addcategories', { error: 'An error occurred while adding the category.' });
    }
};


const AddCategory = async (req, res) => {
    try {
      
        res.render('admin/addcategories',{categories:'',error:''});
    } catch (error) {
        console.error('Error adding category:', error);
        res.redirect('/admin/categories');
    }
};


const editCategory = async (req, res) => {
    try {
        const categoryId = req.params.id; 
        const { name, description } = req.body; 

       
        const existingCategory = await categoryModel.findOne({ name });

        if (existingCategory && existingCategory._id.toString() !== categoryId) {
            // If a duplicate category name is found
            return res.render('admin/editcategories', {
                category: { _id: categoryId, name, description },
                error: 'Category name already exists.',
            });   
        }

        // Update the category
        await categoryModel.findByIdAndUpdate(categoryId, { name, description });

        // Redirect to the categories list on success
        res.redirect('/admin/categories?success=Category updated successfully.');
    } catch (error) {
        console.error('Error updating category:', error);

        // Render the edit page with a general error message
        res.render('editCategory', {
            category: { _id: req.params.id, name: req.body.name, description: req.body.description },
            error: 'An error occurred while updating the category.',
        });
    }
};



const togglecategories= async (req,res)=>{
    try{
     const categoryId=req.params.category_id
      const category= await categoryModel.findOne({_id:categoryId})
      console.log(category);
      console.log('reached reached')

      category.isdelete=!category.isdelete
    
      await category.save()
      res.status(200).json({success:true,message:'category is unlisted'})
      
        
    }catch (err){

    }
}


const loadEditCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;

        // Log the category ID
        console.log('Category ID:', categoryId);

        // Fetch the category by ID
        const category = await categoryModel.findById(categoryId);

        // Log the fetched category for debugging
        console.log('Fetched Category:', category);

        // If the category is not found, redirect to the categories list
        if (!category) {
            console.warn('Category not found for ID:', categoryId);
            return res.redirect('/admin/categories');
        }

        // Render the editcategories page with the category data
        res.render('admin/editcategories', { category, error: null });
    } catch (error) {
        // Log the error with detailed information
        console.error('Error loading edit category page:', error);

        // Redirect to the categories list in case of an error
        res.redirect('/admin/categories');
    }
};



const editproducts=async (req,res)=>{

    try{
        const {id}=req.params
        const products = await productModel.findOne({_id: id})
        console.log(id);
        
        console.log(products);
        
        const categories = await categoryModel.find({})
        res.render('admin/editproducts',{categories,products})
    }
    catch(er){
        console.log(er);
        
    }

}


const editproducttt=async(  req,res)=>{
    const { image1, image2, image3, image4, productName,productId } = req.body
   
    const savedImagePaths = []

const saveBase64ToFile = (base64Data, filename) => {
   
    const matches = base64Data.match(/^data:image\/(png|jpg|jpeg);base64,(.+)$/);
    if (!matches) {
        return false; // Invalid base64 format
    }


    const imageBuffer = Buffer.from(matches[2], 'base64');

    // Specify the relative path where images should be saved
    const filePath = path.join('public', 'images', productName, filename);

    // Ensure the directory exists, or create it if not
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    // Write the image file to the path
    fs.writeFileSync(filePath, imageBuffer);

    // Return the relative file path
    return `images\\${productName}\\${filename}`;
};

// Save each image if base64 data is provided and store the path
if (image1) {
    const savedPath = saveBase64ToFile(image1, 'image1.png');
    if (savedPath) {
        savedImagePaths.push(savedPath);
        console.log('image1 saved:', savedPath);
    }
}
if (image2) {
    const savedPath = saveBase64ToFile(image2, 'image2.png');
    if (savedPath) {
        savedImagePaths.push(savedPath);
        console.log('image2 saved:', savedPath);
    }
}
if (image3) {
    const savedPath = saveBase64ToFile(image3, 'image3.png');
    if (savedPath) {
        savedImagePaths.push(savedPath);
        console.log('image3 saved:', savedPath);
    }
}
if (image4) {
    const savedPath = saveBase64ToFile(image4, 'image4.png');
    if (savedPath) {
        savedImagePaths.push(savedPath);
        console.log('image4 saved:', savedPath);
    }
}

// Remove base64 images from req.body
delete req.body.image1;
delete req.body.image2;
delete req.body.image3;
delete req.body.image4;

// Add the saved image paths array to req.body
req.body.imagePaths = savedImagePaths;

// Log the updated req.body (without base64 data)
console.log('Updated req.body:', req.body);

try {
    // Update the existing product document in MongoDB
    const updatedProduct = await productModel.findByIdAndUpdate(
        productId, // The ID of the product to update
        req.body, // The updated fields
        { new: true, runValidators: true } // Return the updated document and run validators
    );

    if (!updatedProduct) {
        return res.status(404).send('Product not found');
    }

    console.log('Product updated successfully:', updatedProduct);
    res.redirect('/admin/products');
} catch (error) {
    console.error('Error updating product:', error);
    res.status(500).send('Error updating product');
}


}
const logout = async (req, res) => {
    req.session.admin = null
    res.redirect('/admin/login')
}


module.exports = {
    editproducttt,
    editproducts,
    Loadlogin,
    login,
    Loddashbord,
    logout,
    LoadProducts,
    addProduct ,
    renderAddProduct,
    LoadCategory,
    AddCategory,
    postAddCategory,
    editCategory,
    togglecategories,
    loadEditCategory,
    Loadusers
}

