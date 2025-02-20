const router =require('express').Router();
const passport = require('passport');
const userController=require('../controller/user')
const auth=require('../middleware/auth')



router.get('/register',auth.isLogin,userController.loadregister)
router.get('/',auth.isBan,auth.checkSession,userController.loadhome)
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

// router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))
// router.get ('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/register'}),(req,res)=>{
//     res.redirect('/home')
// })


router.get('/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback', 
    passport.authenticate('google', { 
      failureRedirect: '/register',
      failureMessage: true // Optional: store failure message in session
    }),
    (req, res) => {
      // Session is automatically created at this point
      // You can add custom session data here if needed
      req.session.user = {
        id: req.user.id,
        email: req.user.email,
        name: req.user.displayName
      };
  
      // Force session save before redirect (optional)
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
        }
        res.redirect('/');
      });
    }
  );

router.get('/shope',auth.isBan,userController.Loadshope)
router.get('/product/:id', userController.Loadproductdeatails);



module.exports = router;
