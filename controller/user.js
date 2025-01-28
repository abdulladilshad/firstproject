const userschema = require('../models/usermodel')
const bcrypt = require('bcrypt')
const saltround = 10
const categoryModel = require('../models/categories')
const productModel = require('../models/product')


const loadregister = async (req, res) => {
    res.render('user/register', { message: null }); // Pass a default value
};

const register = async (req, res) => {
    try {
        const { email, password, confirmpassword } = req.body;

        if (!email || !password || !confirmpassword) {
            return res.render('user/register')
        }

        if (password !== confirmpassword) {
            return res.render('user/register', { message: 'Passwords do not match' });
        }

        const user = await userschema.findOne({ email });
        if (user) {
            return res.render('user/register', { message: 'User already exists' });
        }

        const hashedpassword = await bcrypt.hash(password, saltround);

        const newUser = new userschema({
            email,
            password: hashedpassword,
        });
        await newUser.save();

        res.render('user/login', { message: 'User created successfully' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.render('user/register', { message: 'Something went wrong' });
    }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.render('user/login', { message: 'Email and password are required ' })
        }

        const user = await userschema.findOne({ email })
        console.log(user)

        if (!user) {
            res.render('user/login', { message: 'User does not exists' })
            console.log('if1')
        }
        const isMatch = await bcrypt.compare(password, user.password)
        console.log(isMatch);

        if (!isMatch) {
            return res.render('user/login', { message: 'incorrect password ' })
        }
        req.session.user = { id: user._id, email: user.email }
        const products = await productModel.find({})
        console.log(products)
        const categories = await categoryModel.find({})
        console.log(categories);
        res.render('user/index', { products,categories})


       

    } catch (error) {
        console.error('Erorr during  login', error);
        res.render('user/login', { message: 'somthing went wrong' })

    }
}

const Loadlogin = (req, res) => {
    const message = req.query.message || '';
    res.render('user/login', { message });
};


// const Loadhome = (req,res)=>{

// res.render('user/Home')
// }



const loadhome = async (req, res) => {
    try {
        const products = await productModel.find({})
        console.log(products);
        res.render('user/index', { products })

        const categories = await categoryModel.find({})
        console.log(categories);
        res.render('user/index', { categories })



    } catch (error) {
        console.error('Error loading home:', error);
        res.render('user/index', { products: [], message: 'Failed to load products' });
    }

}

const logout = (req, res) => {
    req.session.user = null
    res.redirect('/user/login')
}

module.exports = {
    loadhome,
    loadregister,
    register,
    Loadlogin,
    login,
    logout

}