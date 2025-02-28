const router = require('express').Router();
const passport = require('passport');
const userController = require('../controller/user')
const cartController = require('../controller/cart')
const addressController = require('../controller/address')
const orderController = require('../controller/order')
const checkoutController = require('../controller/checkout')
const profileController = require('../controller/profile')
const changePassword = require('../controller/changePassword')
const auth = require('../middleware/auth')
const uploadMiddleware = require('../middleware/multer')



router.get('/register', auth.isLogin, userController.loadregister)
router.get('/', auth.checkSession, auth.isBan, userController.loadhome)
router.post('/register', userController.register)


router.get('/login', auth.isLogin, userController.Loadlogin)
router.post('/login', auth.isLogin, userController.login)

// router.get('/home',userController.Loadhome)
router.get('/logout', auth.checkSession, userController.logout)


//OTP
router.get('/verify-otp', userController.Loadotp)
router.post('/verify-otp', userController.postotp)
//RESEND OTP
router.get("/resend-otp", userController.ResendOtp)




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

router.get('/shope', auth.isBan, auth.checkSession, userController.Loadshope)

router.get('/product/:id', auth.isBan, auth.checkSession, userController.Loadproductdeatails);

//pro


router.get('/cart', cartController.LoadCart);
router.post('/cart', cartController.addCart);
router.delete('/cart/remove/:productId', cartController.removeCart);
router.get('/all', cartController.getCartItems);

router.get('/profile', profileController.getProfile);
router.post('/profile/update', uploadMiddleware, profileController.updateProfile);

router.get("/checkout", checkoutController.getCheckout);


router.post("/order/place", orderController.placeOrder);
router.get('/order/success/:orderId', orderController.orderSuccess);
router.get("/orders", orderController.orderHistory);
router.post('/orders/cancel',orderController.cancelOrder)




router.get('/address', addressController.getAddresses);
router.post('/addresses', addressController.addAddress);
router.put('/addresses/:id', addressController.updateAddress);
router.delete('/addresses/:id', addressController.deleteAddress);
router.get('/addresses/:id', addressController.getAddress);


router.post('/change-password', changePassword.changePassword);
router.post('/send-otp', changePassword.sendOtpForGoogleUser);
router.get('/change-password', changePassword.renderChangePasswordPage);

router.put('/select-address', addressController.selectAddress);





module.exports = router;
