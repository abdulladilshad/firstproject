const router = require('express').Router();
const passport = require('passport');
const userController = require('../controller/user')
const cartController = require('../controller/cart')
const wishlistController = require('../controller/wishlist')
const addressController = require('../controller/address')
const orderController = require('../controller/order')
const checkoutController = require('../controller/checkout')
const walletController = require('../controller/wallet')
const profileController = require('../controller/profile')
const changePassword = require('../controller/changePassword')
const forgetPaswword = require('../controller/forgetpassword')
const auth = require('../middleware/auth')
const uploadMiddleware = require('../middleware/multer')



router.get('/register', auth.isLogin, userController.loadregister)
router.get('/', userController.loadhome)
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


//Forget paswword 
router.get("/forgetpassword", forgetPaswword.renderForgotPassword);
router.post("/forgetpassword", forgetPaswword.forgotPassword);

router.get("/verifyotp", forgetPaswword.renderVerifyOtp);
router.post("/verifyotp", forgetPaswword.verifyOtp);

router.get("/reset-password", forgetPaswword.renderResetPassword);
router.post("/reset-password", forgetPaswword.resetPassword);


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




router.get('/shope', userController.Loadshope);

router.get('/product/:id',  userController.Loadproductdeatails);

//pro


router.get('/cart', auth.isBan, auth.checkSession,cartController.LoadCart);
router.post('/cart', auth.isBan, auth.checkSession,cartController.addCart);
router.delete('/cart/remove/:productId', auth.isBan, auth.checkSession,cartController.removeCart);
router.get('/all',auth.isBan, auth.checkSession, cartController.getCartItems);
router.post('/cart/update/:productId',auth.isBan, auth.checkSession, cartController.updateQuatity)



router.get('/wishlist', wishlistController.getWishlist);
router.post('/wishlist', wishlistController.addToWishlist);
router.delete('/wishlist/:itemId', wishlistController.removeFromWishlist);




router.get('/profile', auth.isBan, auth.checkSession,profileController.getProfile);
router.post('/profile/update', auth.isBan, auth.checkSession,uploadMiddleware, profileController.updateProfile);

router.get("/checkout",auth.isBan, auth.checkSession, checkoutController.getCheckout);


router.post("/order/place", auth.isBan, auth.checkSession,orderController.placeOrder);
router.get('/order/success/:orderId',auth.isBan, auth.checkSession, orderController.orderSuccess);
router.get("/orders",auth.isBan, auth.checkSession, orderController.orderHistory);
router.post('/orders/cancel',auth.isBan, auth.checkSession,orderController.cancelOrder)
router.post('/return/:orderId/:productId', orderController.returnOrder);




router.get('/address',auth.isBan, auth.checkSession, addressController.getAddresses);
router.post('/addresses',auth.isBan, auth.checkSession, addressController.addAddress);
router.put('/addresses/:id',auth.isBan, auth.checkSession, addressController.updateAddress);
router.delete('/addresses/:id',auth.isBan, auth.checkSession, addressController.deleteAddress);
router.get('/addresses/:id',auth.isBan, auth.checkSession, addressController.getAddress);



router.get('/wallet', walletController.getWallet);
router.post('/wallet', walletController.deposit);



router.post('/change-password',auth.isBan, auth.checkSession, changePassword.changePassword);
router.post('/send-otp',auth.isBan, auth.checkSession, changePassword.sendOtpForGoogleUser);
router.get('/change-password',auth.isBan, auth.checkSession, changePassword.renderChangePasswordPage);

router.put('/select-address', auth.isBan, auth.checkSession,addressController.selectAddress);



router.post('/place', orderController.placeOrders);


router.post('/create', orderController.createRazorpayOrder);
router.post('/verify-payment', orderController.verifyRazorpayPayment);

// Order success page
router.get('/success/:orderId', orderController.orderSuccesss);


router.post('/check-stock/:productId', cartController.checkStock);
module.exports = router;
