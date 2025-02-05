const router =require('express').Router();
const Product =require("../models/product")


const adminController = require('../controller/admin')
const adminauth = require('../middleware/admin')


//LOGIN
router.get('/login', adminauth.isLogin, adminController.Loadlogin); 
router.post('/login', adminController.login);

//DASHBORD
router.get('/dashboard', adminauth.cheksession, adminController.Loddashbord);

//PRODUCTS
router.get('/products',adminController.LoadProducts)
router.post('/addproducts',adminController.addProduct);
router.get('/addproducts', adminController.renderAddProduct);
router.get('/editproducts/:id',adminController.editproducts)
router.post('/editproducttt',adminController.editproducttt)

//products pagination



//UNLIST AND LIST PRODUCTS
router.put('/products/toggle-status/:product_id', adminController.toggleProductStatus);


//CATEGORIES
router.get('/categories',adminController.LoadCategory)
router.get('/addcategories',adminController.AddCategory)
router.post('/addcategories',adminController.postAddCategory);
router.get('/categories/edit/:id',adminController.loadEditCategory)
router.post('/categories/edit/:id',adminController.editCategory)  

//UNLIST & LIST CATEGORIES
router.put('/categories/toggle-status/:category_id',adminController.togglecategories)

      
//PRODUCT IMAGE VIEW
router.get('/getProductById/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        console.log("Fetching product with ID:", productId); 
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).send({ error: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Server error while fetching product' });
    }
});

//USER 
router.get('/users',adminController.Loadusers)

//BLOCK AND UNBLOCK USERS
router.put('/users/toggle-status/:user_id', adminController.toggleUserStatus);


//LOGOUT
router.post('/logout',adminauth.cheksession,adminController.logout)


module.exports=router

