const router =require('express').Router();
const Product =require("../models/product")


const adminController = require('../controller/admin')
const adminauth = require('../middleware/admin')


//LOGIN
router.get('/login', adminauth.isLogin, adminController.Loadlogin); 
router.post('/login', adminController.login);

//DASHBORD
router.get('/dashboard',adminauth.cheksession, adminController.Loddashbord);

// PRODUCT MANAGEMENT 
router.get('/products',adminauth.cheksession, adminController.LoadProducts);
router.post('/addproducts', adminauth.cheksession, adminController.addProduct);
router.get('/addproducts', adminauth.cheksession, adminController.renderAddProduct);
router.get('/editproducts/:id', adminauth.cheksession, adminController.editproducts);
router.post('/editproducttt', adminauth.cheksession, adminController.editproducttt);
router.put('/products/toggle-status/:product_id', adminauth.cheksession, adminController.toggleProductStatus);


// CATEGORY MANAGEMENT 
router.get('/categories', adminauth.cheksession, adminController.LoadCategory);
router.get('/addcategories', adminauth.cheksession, adminController.AddCategory);
router.post('/addcategories', adminauth.cheksession, adminController.postAddCategory);
router.get('/categories/edit/:id', adminauth.cheksession, adminController.loadEditCategory);
router.post('/categories/edit/:id', adminauth.cheksession, adminController.editCategory);
router.put('/categories/toggle-status/:category_id', adminauth.cheksession, adminController.togglecategories);


      
//PRODUCT IMAGE VIEW
router.get('/getProductById/:id', async (req, res) => {
    try {
        const productId = req.params.id;
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



  // USER MANAGEMENT
router.get('/users', adminauth.cheksession, adminController.Loadusers);
router.put('/users/toggle-status/:user_id', adminauth.cheksession, adminController.toggleUserStatus);


//LOGOUT
router.post('/logout',adminauth.cheksession,adminController.logout)


module.exports=router

