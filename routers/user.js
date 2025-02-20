const router =require('express').Router();
const passport = require('passport');
const userController=require('../controller/user')
const auth=require('../middleware/auth')



router.get('/register',auth.isLogin,userController.loadregister)
router.get('/',auth.checkSession,auth.isBan,userController.loadhome)
router.post('/register',userController.register)


router.get('/login',auth.isLogin,userController.Loadlogin)
router.post('/login',auth.isLogin,userController.login)

// router.get('/home',userController.Loadhome)
router.get('/logout',auth.checkSession,userController.logout)


//OTP
router.get('/verify-otp',userController.Loadotp)
router.post('/verify-otp',userController.postotp)
//RESEND OTP
router.get("/resend-otp",userController.ResendOtp)




router.get('/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback', 
    passport.authenticate('google', { 
      failureRedirect: '/register',
      failureMessage: true 
    }),
    (req, res) => {
      
      req.session.user = {
        id: req.user.id,
        email: req.user.email,
        name: req.user.displayName
      };
  
      
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
        }
        res.redirect('/');
      });
    }
  );

router.get('/shope',auth.isBan,auth.checkSession,userController.Loadshope)
router.get('/product/:id',auth.isBan,auth.checkSession,userController.Loadproductdeatails);



module.exports = router;
