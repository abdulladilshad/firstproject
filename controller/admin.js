const usermodel = require('../models/usermodel')
const adminSchema = require('../models/adminmodel')
const bcrypt = require('bcryptjs');
const categoryModel = require('../models/categories')
const productModel = require('../models/product')
const fs = require('fs');
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


        req.session.admin = true;
        console.log(req.session);

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

        let users = [];

        if (searchQuery) {
            users = await usermodel
                .find({
                    email: { $regex: searchQuery, $options: 'i' },
                })
                .exec()
        } else {
            users = await usermodel.find({}).exec()
        }


        const usersWithIndex = users.map((user, index) => {
            const userObject = user.toObject();
            userObject.originalIndex = index + 1
            return userObject;
        })

        res.render('admin/dashbord', {
            users: usersWithIndex,
            searchQuery: searchQuery,
        })

    } catch (error) {
        console.error('Error while fetching dashboard users:', error);
        res.render('admin/login', { message: 'Failed to load dashboard' })
    }
}


const Loadusers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 8;

        const users = await usermodel.paginate({}, { page, limit })

        res.render('admin/adminUser', { users });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};



const toggleUserStatus = async (req, res) => {
    try {
        const userId = req.params.user_id;
        const user = await usermodel.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        user.isBlock = !user.isBlock;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User has been ${user.isBlock ? 'unblocked' : 'blocked'}`,
        });
    } catch (err) {
        console.error('Error toggling user status:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};




const LoadProducts = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        let limit = 7;

        const options = {
            page,
            limit,
            sort: { _id: -1 },
            populate: { path: 'category', select: 'name' }
        };

        const products = await productModel.paginate({}, options);

        res.render('admin/products', {
            products: products.docs,
            currentPage: page,
            totalPages: products.totalPages
        });

    } catch (error) {
        console.error('Error loading products:', error);
        res.render('admin/login', { message: 'Failed to load products' });
    }
};


const renderAddProduct = async (req, res) => {
    try {
        const categories = await categoryModel.find({});


        res.render('admin/addproducts', { categories, error: '' });
    } catch (error) {
        console.error('Error while fetching categories:', error);
        res.render('admin/addproducts');
    }
};

const toggleProductStatus = async (req, res) => {
    try {
        const productId = req.params.product_id;
        const product = await productModel.findOne({ _id: productId });

        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        product.isDelete = !product.isDelete;
        await product.save();

        res.status(200).json({
            success: true,
            message: product.isListed ? 'Product is now listed' : 'Product is now unlisted',
        });
    } catch (err) {
        console.error('Error updating product status:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};



const addProduct = async (req, res) => {
    const { image1, image2, image3, image4, productName } = req.body;


    if (!productName) {
        return res.status(400).send("Product name is required.");
    }

    try {

        const productCount = await productModel.countDocuments();
        if (productCount < 2) {
            return res.status(403).send("At least 2 products must exist before adding a new one.");
        }


        const existingProduct = await productModel.findOne({
            productName: { $regex: new RegExp("^" + productName.trim() + "$", "i") }
        });

        if (existingProduct) {
            const categories = await categoryModel.find({});
            return res.render('admin/addproducts', {
                error: 'Product name already exists',
                categories
            });
        }


        const savedImagePaths = [];


        const saveBase64ToFile = async (base64Data, filename) => {
            const matches = base64Data.match(/^data:image\/(png|jpg|jpeg);base64,(.+)$/);
            if (!matches) return false;

            const imageBuffer = Buffer.from(matches[2], 'base64');
            const productname = productName.trim().replace(/\s+/g, '');
            const filePath = path.join('public', 'images', productname, filename);
            const dirPath = path.dirname(filePath);


            try {
                await fs.promises.access(dirPath);
            } catch (error) {
                await fs.promises.mkdir(dirPath, { recursive: true });
            }


            await fs.promises.writeFile(filePath, imageBuffer);

            return `images/${productname}/${filename}`;
        };


        if (image1) {
            const savedPath = await saveBase64ToFile(image1, 'image1.png');
            if (savedPath) savedImagePaths.push(savedPath);
        }
        if (image2) {
            const savedPath = await saveBase64ToFile(image2, 'image2.png');
            if (savedPath) savedImagePaths.push(savedPath);
        }
        if (image3) {
            const savedPath = await saveBase64ToFile(image3, 'image3.png');
            if (savedPath) savedImagePaths.push(savedPath);
        }
        if (image4) {
            const savedPath = await saveBase64ToFile(image4, 'image4.png');
            if (savedPath) savedImagePaths.push(savedPath);
        }


        delete req.body.image1;
        delete req.body.image2;
        delete req.body.image3;
        delete req.body.image4;


        req.body.imagePaths = savedImagePaths;


        if (req.body.color) {
            req.body.color = req.body.color.split(",").map(c => c.trim());
        }


        let variants;
        try {
            variants = JSON.parse(req.body.variants || '[]');

            if (!Array.isArray(variants)) {
                return res.status(400).send("Variants must be an array.");
            }

            for (let variant of variants) {
                if (!variant.color || typeof variant.color !== 'string' || variant.color.trim() === "") {
                    return res.status(400).send("Each variant must have a valid color.");
                }
                if (!variant.quantity || isNaN(variant.quantity) || Number(variant.quantity) <= 0) {
                    return res.status(400).send("Each variant must have a stock quantity greater than 0.");
                }
            }
        } catch (err) {
            console.error("Error parsing variants JSON:", err);
            return res.status(400).send("Invalid JSON format for variants.");
        }



        req.body.variants = variants;


        const newProduct = new productModel(req.body);
        await newProduct.save();

        res.redirect('/admin/products');

    } catch (error) {
        console.error('Error saving product:', error);
        res.status(500).send('Error saving product');
    }
};






const LoadCategory = async (req, res) => {
    try {
        const admin = req.session.admin;
        if (!admin) return res.redirect('/admin/login');

        const categories = await categoryModel.find({});

        const categoryIds = categories.map(cat => cat._id);

        const products = await productModel.find({ category: { $in: categoryIds } });

        console.log("ffffffffffffffffffff", products)

        res.render('admin/categories', { categories, products });
    } catch (error) {
        console.error('Error loading categories:', error);
        res.render('admin/dashbord', { message: 'Failed to load categories' });
    }
};

const postAddCategory = async (req, res) => {
    try {
        const { name, description } = req.body;


        if (!name || !description) {
            return res.render('admin/addcategories', { error: 'Category name and description are required' });
        }


        const existingCategory = await categoryModel.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
        if (existingCategory) {
            return res.render('admin/addcategories', { error: 'Category name already exists' });
        }


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

        res.render('admin/addcategories', { categories: '', error: '' });
    } catch (error) {
        console.error('Error adding category:', error);
        res.redirect('/admin/categories');
    }
};


const editCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { name, description } = req.body;



        const existingCategory = await categoryModel.findOne({
            name: { $regex: new RegExp(`^${name}$`, "i") },
            _id: { $ne: categoryId }
        });

        if (existingCategory) {
            return res.render('admin/editcategories', {
                category: { _id: categoryId, name, description },
                error: 'Category name already exists.',
            });
        }


        await categoryModel.findByIdAndUpdate(categoryId, { name, description });


        res.redirect('/admin/categories?success=Category updated successfully.');
    } catch (error) {
        console.error('Error updating category:', error);


        res.render('editCategory', {
            category: { _id: req.params.id, name: req.body.name, description: req.body.description },
            error: 'An error occurred while updating the category.',
        });
    }
};


const togglecategories = async (req, res) => {
    try {
        const categoryId = req.params.category_id
        const category = await categoryModel.findOne({ _id: categoryId })
        console.log(category);
        console.log('reached reached', req.query)

        category.isdelete = !category.isdelete

        await productModel.updateMany(
            { category: categoryId },
            { $set: { isDelete: true } }
        );


        await category.save()
        res.status(200).json({ success: true, message: 'category is unlisted' })


    } catch (err) {

    }
}


const loadEditCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;


        console.log('Category ID:', categoryId);


        const category = await categoryModel.findById(categoryId);


        console.log('Fetched Category:', category);


        if (!category) {
            console.warn('Category not found for ID:', categoryId);
            return res.redirect('/admin/categories');
        }


        res.render('admin/editcategories', { category, error: null });
    } catch (error) {

        console.error('Error loading edit category page:', error);


        res.redirect('/admin/categories');
    }
};



const editproducts = async (req, res) => {

    try {
        const { id } = req.params
        const products = await productModel.findOne({ _id: id })
        console.log(id);

        console.log(products);

        const categories = await categoryModel.find({})
        res.render('admin/editproducts', { categories, products, errorMessage: '' })
    }
    catch (er) {
        console.log(er);

    }

}

const editproducttt = async (req, res) => {
    const { productId, image1, image2, image3, image4, productName, category, price, brand, productDescription, material } = req.body;

    if (!productId) {
        return res.status(400).send("Product ID is required.");
    }

    try {

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).send("Product not found.");
        }


        if (productName) {
            const existingProduct = await productModel.findOne({
                productName: { $regex: new RegExp("^" + productName.trim() + "$", "i") },
                _id: { $ne: productId }
            });

            if (existingProduct) {
                const categories = await categoryModel.find();
                return res.render('admin/editproducts', {
                    errorMessage: "Product name already exists!",
                    products: product,
                    categories
                });
            }

            product.productName = productName.trim();
        }



        const saveBase64ToFile = async (base64Data, filename) => {
            const matches = base64Data.match(/^data:image\/(png|jpg|jpeg);base64,(.+)$/);
            if (!matches) return false;

            const imageBuffer = Buffer.from(matches[2], 'base64');
            const productname = product.productName.replace(/\s+/g, '');
            const filePath = path.join('public', 'images', productname, filename);
            const dirPath = path.dirname(filePath);

            try {
                await fs.promises.access(dirPath);
            } catch (error) {
                await fs.promises.mkdir(dirPath, { recursive: true });
            }

            await fs.promises.writeFile(filePath, imageBuffer);
            return `images/${productname}/${filename}`;
        };


        const savedImagePaths = [...(product.imagePaths || [])];


        if (image1) {
            savedImagePaths[0] = await saveBase64ToFile(image1, 'image1.png');
        }
        if (image2) {
            savedImagePaths[1] = await saveBase64ToFile(image2, 'image2.png');
        }
        if (image3) {
            savedImagePaths[2] = await saveBase64ToFile(image3, 'image3.png');
        }
        if (image4) {
            savedImagePaths[3] = await saveBase64ToFile(image4, 'image4.png');
        }

        product.imagePaths = savedImagePaths;
        product.category = category;
        product.productDescription = productDescription
        product.price = price
        product.brand = brand
        product.material = material

        let variants;
        try {
            variants = JSON.parse(req.body.variants || '[]');
            if (!Array.isArray(variants)) {
                return res.status(400).send("Variants must be an array.");
            }
            for (let variant of variants) {
                if (!variant.color || typeof variant.color !== 'string' || variant.color.trim() === "") {
                    return res.status(400).send("Each variant must have a valid color.");
                }
                if (!variant.quantity || isNaN(variant.quantity) || Number(variant.quantity) <= 0) {
                    return res.status(400).send("Each variant must have a stock quantity greater than 0.");
                }
            }
        } catch (err) {
            console.error("Error parsing variants JSON:", err);
            return res.status(400).send("Invalid JSON format for variants.");
        }


        product.variants = variants;

        await product.save();
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).send('Error updating product');
    }
};




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
    addProduct,
    renderAddProduct,
    LoadCategory,
    AddCategory,
    postAddCategory,
    editCategory,
    togglecategories,
    loadEditCategory,
    Loadusers,
    toggleProductStatus,
    toggleUserStatus
}

