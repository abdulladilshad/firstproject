const router =require('express').Router();
const userController=require('../controller/user')
const auth=require('../middleware/auth')




router.get('/register',auth.isLogin,userController.loadregister)

router.post('/register',userController.register)


router.get('/login',auth.isLogin,userController.Loadlogin)
router.post('/login',userController.login)
router.get('/home',userController.Loadhome)
router.post('/logout',auth.checkSession,userController.logout)



module.exports = router;
