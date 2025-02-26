
const { session } = require('passport');
const usermodel = require('../models/usermodel')
const checkSession = (req, res, next) => {
    if (req.session && req.session.user) {
        next()
    } else {
        res.redirect('/login')
    }
}

const isLogin = (req, res, next) => {



    if (req.session && req.session.user) {
        return res.redirect('/');
    } else {
        return next();
    }
};

const isBan = async (req, res, next) => {
    const ID = req.session?.user?.id;

    const user = await usermodel.findOne({ _id: ID });
    
    if (user?.isBlock) {

        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return next(err);
            }
            // Set flash in the new session created after destruction
            res.render('user/login', { message:['You have been Blocked'] });
        ;
        });
    } else {
        next();
    }
};

module.exports = { checkSession, isLogin, isBan } 