const userschema = require('../models/usermodel');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer'); // For OTP
const otpGenerator = require('otp-generator');
const sentOtp = require('../controller/user')


const otpStorage = {};

const changePassword = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'User not logged in' });

        const user = await userschema.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const { currentPassword, newPassword, otp } = req.body;

        if (user.isGoogleUser) {
            
            if (!otp || otp !== otpStorage[user.email]) {
                return res.status(400).json({ success: false, message: 'Invalid OTP' });
            }
        } else {
            
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) return res.status(400).json({ success: false, message: 'Incorrect current password' });
        }

        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};


const sendOtpForGoogleUser = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'User not logged in' });

        const user = await userschema.findById(userId);
        if (!user || !user.isGoogleUser) return res.status(400).json({ success: false, message: 'Not a Google user' });

        await sentOtp(user.email);
        res.json({ success: true, message: 'OTP sent to your email' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const renderChangePasswordPage = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        if (!userId) return res.redirect('/login');

        const user = await userschema.findById(userId);
        if (!user) return res.redirect('/login');
        

        res.render('user/changePassword', {  user: req.session.user || null});
    } catch (error) {
        console.error('Error rendering change password page:', error);
        res.status(500).send('Server Error');
    }
};

module.exports = { renderChangePasswordPage };

module.exports = {
    changePassword,
    sendOtpForGoogleUser,
    renderChangePasswordPage
};
