const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const userschema = require('../models/usermodel')
const Otp = require("../models/otpModel");

const renderForgotPassword = (req, res) => {
    res.render("user/forgetpassword", { message: req.flash("error") });
};


const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        console.log(email);

        const user = await userschema.findOne({ email });
        if (!user) {
            console.log('dsfhjbdkjdhhdsjh');

            return res.redirect("/forgetpassword");
        }

        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        
        await Otp.deleteOne({ email }); 
        await Otp.create({
            email,
            otp,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000) 
        });


        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.USER_MAIL,
                pass: process.env.USER_PASS,
            },
            tls: {
                rejectUnauthorized: false 
            }
        });

        const mailOptions = {
            to: user.email,
            from: process.env.USER_MAIL,
            subject: "Password Reset OTP",
            text: `Your OTP for password reset is: ${otp}. This OTP is valid for 5 minutes.`,
        };


        await transporter.sendMail(mailOptions);

       
        req.session.resetEmail = email;

        res.render("user/forgetotp", { email, message: "" });

    } catch (error) {
        console.log(error);
        req.flash("error", "Something went wrong!");
        res.redirect("/forgetpassword");
    }
};


const renderVerifyOtp = (req, res) => {
    const email = req.session.resetEmail;  

    if (!email) {
        req.flash("error", "Session expired, please try again.");
        return res.redirect("/forgetpassword");
    }

    res.render("user/forgetotp", { email, message: req.flash("error") });
};


const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const email = req.session.resetEmail;

        if (!email) {
            req.flash("error", "Session expired, please try again.");
            return res.redirect("/forgetpassword");
        }

        console.log("Verifying OTP for email:", email);

        
        const otpRecord = await Otp.findOne({ email, otp });

        if (!otpRecord) {
            req.flash("error", "Invalid or expired OTP.");
            return res.redirect("/verifyotp");
        }

        console.log("OTP verified successfully!");

        
        await Otp.deleteOne({ email });

        
        res.render("user/resetPassword", { email, message: "" });

    } catch (error) {
        console.error("Error in verifyOtp:", error); 
        req.flash("error", "Something went wrong!");
        res.redirect("/forgetpassword");
    }
};



const renderResetPassword = (req, res) => {
    res.render("user/resetPassword", { message: req.flash("error") });
};


const resetPassword = async (req, res) => {
    const email = req.session.resetEmail;
    const { newPassword } = req.body;

    if (!email) {
        req.flash("error", "Session expired, please try again.");


        return res.redirect("/forgetpassword");
    }

    try {
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userschema.updateOne({ email }, { password: hashedPassword });

        req.session.resetEmail = null;

        req.flash("success", "Password reset successful! Please log in.");
        res.redirect("/login");

    } catch (error) {
        console.error("Error:", error);
        req.flash("error", "Something went wrong!");
        res.redirect("/forgetpassword");
    }
};

module.exports = {
    renderForgotPassword,
    forgotPassword,
    verifyOtp,
    renderVerifyOtp,
    renderResetPassword,
    resetPassword
}