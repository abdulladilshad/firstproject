const userschema = require('../models/usermodel')
const categoryModel = require('../models/categories')
const productModel = require('../models/product')
const Otp =require('../models/otpmodel')
const nodemailer = require('nodemailer')
const otpGenerator = require('otp-generator')
const dotenv =require ("dotenv") 
const bcrypt = require('bcrypt')
const saltround = 10

dotenv.config()

const ResendOtp = async (req,res)=>{
    try {

        const {email} = req.query
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await Otp.create({ email, otp });
         await sentOtp(email, otp);

        // Redirect to OTP verification page with email in query
        res.render('user/otp', { email: email,message:"" })

        
    } catch (error) {
        
    }


}

const sentOtp = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.USER_MAIL,
            pass: process.env.USER_PASS
        },
        tls: {
            rejectUnauthorized: false // Disable SSL certificate validation
        }
    });

    const mailOptions = {
        from: process.env.USER_MAIL,
        to: email,
        subject: 'OTP for verification',
        text: `YOUR OTP for verification is: ${otp}`,
    };
        try {
            
            await transporter.sendMail(mailOptions);

        } catch (error) {
                  console.error('Error sending email:', error);
        }
};




const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.USER_MAIL,
        pass: process.env.USER_PASS
    },
    tls: {
        rejectUnauthorized: false // Ignore certificate validation
    }
});



const Loadotp = async (req, res) => {
    const { email } = req.query;
    
    
    console.log("1",email);
    // Get email from query params

    if (!email) {
        return res.status(400).send("Email is required for OTP verification");
    }

    res.render('user/otp', { email:email, message: "" }); // Ensure message is always passed
};


const postotp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        console.log("2", email);
        
        // Ensure email and otp are provided
        if (!email || !otp) {
            return res.render('user/otp', { message: 'Email and OTP are required' });
        }

        // Find OTP record in the database
        const otpRecord = await Otp.findOne({ email });

        if (!otpRecord) {
            return res.render('user/otp', { message: 'OTP expired or not found' });
        }

        if (otpRecord.otp != otp) {
            return res.render('user/otp', { message: 'Invalid OTP',email });
        }

        // Mark user as verified
        await userschema.updateOne({ email }, { $set: { isVerified: true } });

        // Delete OTP after successful verification
        await Otp.deleteOne({ email });

        // Store user session and redirect to homepage
        req.session.user = { email };
         res.redirect('/'); // This return statement prevents further code execution
    } catch (error) {
        console.error('Error during OTP verification:', error);
        return res.render('user/otp', { message: 'Something went wrong' });
    }
};






const loadregister = async (req, res) => {



    res.render('user/register', { message: null }); // Pass a default value
};

const register = async (req, res) => {
    try {
        const { email, password, confirmpassword } = req.body;

        // Validate required fields
        if (!email || !password || !confirmpassword) {
            return res.render('user/register', { message: 'All fields are required' });
        }

        if (password !== confirmpassword) {
            return res.render('user/register', { message: 'Passwords do not match' });
        }

        // Check if user already exists
        const existingUser = await userschema.findOne({ email });
        if (existingUser) {
            return res.render('user/register', { message: 'User already exists' });
        }

        // Hash password
        const hashedpassword = await bcrypt.hash(password, 10);

        // Save new user
        const newUser = new userschema({ email, password: hashedpassword, isVerified: false });
        await newUser.save();

        // Delete any existing OTP for this email
        await Otp.deleteOne({ email });

        // Generate OTP (6-digit)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP with expiration (optional: set TTL in schema)
        await Otp.create({ email, otp });

        // Send OTP to user's email
        await sentOtp(email, otp);

        // Redirect to OTP verification page with email in query
        res.render('user/otp', { email: email,message:"" })

    } catch (error) {
        console.error('Error during registration:', error);
        res.render('user/register', { message: 'Something went wrong. Please try again.' });
    }
};

   




const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            req.flash('error', 'Email and password are required');
            return res.redirect('/login');
        }

        const user = await userschema.findOne({ email });

        if (!user) {
            req.flash('error', 'User does not exist');
            return res.redirect('/login');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash('error', 'Incorrect password');
            return res.redirect('/login');
        }
        // Check if user is banned
        if (user.isBlock) {
            req.session.destroy();
            return res.render('user/login', { message: ['Your account has been banned'] });
        }
        req.session.user = { id: user._id, email: user.email };

        res.redirect('/'); // Redirect to home page

    } catch (error) {
        console.error('Error during login:', error);
       
        res.redirect('/login');
    }
};
    



const Loadlogin = (req, res) => {
    const message = req.flash('error'); 
    console.log('dsujkgfdksjhfghdsjkfhgsdjk');
console.log(message);
    
    console.log('dsujkgfdksjhfghdsjkfhgsdjk');

    res.render('user/login', { message: Array.isArray(message) ? message : [message] });
};


// const Loadhome = (req,res)=>{
// res.render('user/Home')
// }



const loadhome = async (req, res) => {
    try {
        const products = await productModel.find({isDelete:false})
        console.log(products);

        const categories = await categoryModel.find({isdelete:false})
        console.log(categories);
        res.render('user/index', { categories,products })
          

    } catch (error) {
        console.error('Error loading home:', error);
        res.render('user/index', { products: [], message: 'Failed to load products' });
    }

}

const Loadshope = async (req, res) => {
    try {
        const products = await productModel.find({isDelete:false})
        console.log(products);

        const categories = await categoryModel.find({isdelete:false})
        console.log(categories);
        res.render('user/shope', { categories ,products})



    } catch (error) {
        console.error('Error loading home:', error);
        res.render('user/index', { products: [], message: 'Failed to load products' });
    }

}


const Loadproductdeatails= async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await productModel.findById(productId);

        if (!product) {
            return res.status(404).send('Product not found');
        }

        res.render('user/productdeatails', { product }); // Rendering productDetails.ejs
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).send('Internal Server Error');
    }

}

const logout = (req, res) => {
    req.session.destroy()
    res.redirect('/login')
}



module.exports = {
    loadhome,
    loadregister,
    register,
    Loadlogin,
    login,
    logout,
    postotp,
    Loadotp,
    ResendOtp,
    Loadshope,
    Loadproductdeatails

}