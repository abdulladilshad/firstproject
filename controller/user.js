const userschema = require('../models/usermodel')
const categoryModel = require('../models/categories')
const productModel = require('../models/product')
const Otp =require('../models/otpModel')
const nodemailer = require('nodemailer')
const otpGenerator = require('otp-generator')
const dotenv =require ("dotenv") 
const bcrypt = require('bcryptjs');



dotenv.config()

const ResendOtp = async (req,res)=>{
    try {

        const {email} = req.query
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await Otp.create({ email, otp });
         await sentOtp(email, otp);

       
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
            rejectUnauthorized: false 
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
        rejectUnauthorized: false 
    }
});



const Loadotp = async (req, res) => {
    const { email } = req.query;
    
    

    if (!email) {
        return res.status(400).send("Email is required for OTP verification");
    }

    res.render('user/otp', { email:email, message: "" }); 
};


const postotp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        
       
        if (!email || !otp) {
            return res.render('user/otp', { message: 'Email and OTP are required' });
        }

        
        const otpRecord = await Otp.findOne({ email });

        if (!otpRecord) {
            return res.render('user/otp', { message: 'OTP expired or not found' });
        }

        if (otpRecord.otp != otp) {
            return res.render('user/otp', { message: 'Invalid OTP',email });
        }

        
        await userschema.updateOne({ email }, { $set: { isVerified: true } });

        
        await Otp.deleteOne({ email });

        
        req.session.user = { email };
         res.redirect('/'); 
    } catch (error) {
        console.error('Error during OTP verification:', error);
        return res.render('user/otp', { message: 'Something went wrong' });
    }
};






const loadregister = async (req, res) => {



    res.render('user/register', { message: null }); 
};

const register = async (req, res) => {
    try {
        const { email, password, confirmpassword } = req.body;

        
        if (!email || !password || !confirmpassword) {
            return res.render('user/register', { message: 'All fields are required' });
        }

        if (password !== confirmpassword) {
            return res.render('user/register', { message: 'Passwords do not match' });
        }

        
        const existingUser = await userschema.findOne({ email });
        if (existingUser) {
            return res.render('user/register', { message: 'User already exists' });
        }

        
        const hashedpassword = await bcrypt.hash(password, 10);

        
        const newUser = new userschema({ email, password: hashedpassword, isVerified: false });
        await newUser.save();

        
        await Otp.deleteOne({ email });

        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        
        await Otp.create({ email, otp });

       
        await sentOtp(email, otp);

        
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
       
        if (user.isBlock) {
            req.session.destroy();
            return res.render('user/login', { message: ['Your account has been banned'] });
        }
        req.session.user = { id: user._id, email: user.email };

        res.redirect('/'); 

    } catch (error) {
        console.error('Error during login:', error);
       
        res.redirect('/login');
    }
};
    



const Loadlogin = (req, res) => {
    const errorMessages = req.flash("error");
    const successMessages = req.flash("success");
  
    res.render("user/login", { 
        errorMessages: errorMessages.length > 0 ? errorMessages : null,
        successMessages: successMessages.length > 0 ? successMessages : null
     });                                             
};






const loadhome = async (req, res) => {
    try {
        const products = await productModel.find({ isDelete: false }).sort({ _id: -1 });

        const categories = await categoryModel.find({isdelete:false})
        const user = await userschema.findOne({_id: req.session.user.id}, 'image');
        
        res.render('user/index', { categories,products, user })
          

    } catch (error) {
        console.error('Error loading home:', error);
        res.render('user/index', { products: [], message: 'Failed to load products' });
    }

}

const Loadshope = async (req, res) => {
    try {
        const itemsPerPage = 9;
        const page = parseInt(req.query.page) || 1;

      
        const totalItems = await productModel.countDocuments({ isDelete: false });
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        
        const currentPage = Math.max(1, Math.min(page, totalPages));
        const skip = (currentPage - 1) * itemsPerPage;

        
        const products = await productModel
            .find({ isDelete: false })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(itemsPerPage)
            .lean(); 

        
        const categories = await categoryModel
            .find({ isdelete: false })
            .lean();

        res.render('user/shope', {
            categories,
            products,
            currentPage,
            totalPages,
            totalItems,
            itemsPerPage,
            title: 'Shop - LUXE TIME WORLD'
        });

    } catch (error) {
        console.error('Error in Loadshope:', error);
        res.status(500).render('user/shope', {
            categories: [],
            products: [],
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 9,
            error: 'Failed to load products'
        });
    }
};




const Loadproductdeatails = async (req, res) => {
    try {
        const productId = req.params.id;

       
        const product = await productModel.findOne({
            _id: productId,
            isDelete: false
        }).populate({ path: 'category', select: 'name' }).lean();

        console.log(product);

        if (!product) {
            return res.status(404).send('Product not found');
        }

        const categoryOffer = await categoryModel.findById(product.category._id, 'offer').lean();

        const sameCategoryProducts = await productModel.find({ 
            category: product.category._id,
            isDelete: false,
            _id: { $ne: productId } 
        }).limit(4).lean();

        const categoryOfferValue = categoryOffer?.offer || 0;

        res.render('user/productdeatails', { 
            product, 
            sameCategoryProducts, 
            categoryOfferValue 
        });

    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).send('Internal Server Error');
    }
};







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
    Loadproductdeatails,
    sentOtp,
    ResendOtp,
    
}