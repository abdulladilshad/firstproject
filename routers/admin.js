const router =require('express').Router();

const adminController = require('../controller/admin')
const adminauth = require('../middleware/admin')



router.get('/login', adminauth.isLogin, adminController.Loadlogin); // Only for logged-in users trying to access login page
router.post('/login', adminController.login); // Handle actual login

router.get('/dashboard', adminauth.cheksession, adminController.Loddashbord); // Ensure session is active

router.post('/logout',adminauth.cheksession,adminController.logout)

router.get('/products',adminauth.cheksession,adminController.LoadProducts)

router.get('/addproducts',  adminController.renderAddProduct);
router.post('/addproducts', adminController.addProduct);

router.get('/categories',adminauth.cheksession,adminController.LoadCategory)
router.post('/categories', adminauth.cheksession);

router.get('/addcategories',adminController.AddCategory)

router.post('/addcategories', adminController.postAddCategory);

router.put('/categories/toggle-status/:category_id',adminController.togglecategories)

router.get('/categories/edit/:id', adminauth.cheksession ,adminController.loadEditCategory)
router.post('/categories/edit/:id',adminController.editCategory)        





module.exports=router

