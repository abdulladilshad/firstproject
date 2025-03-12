const { session } = require('passport');
const usermodel = require('../models/usermodel');

const checkSession = (req, res, next) => {
    try {
        if (req.session && req.session.user) {
            next();
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error in checkSession middleware:', error);
        res.status(500).render('error', { message: 'Internal Server Error' });
    }
};

const isLogin = (req, res, next) => {
    try {
        if (req.session && req.session.user) {
            return res.redirect('/');
        } else {
            return next();
        }
    } catch (error) {
        console.error('Error in isLogin middleware:', error);
        res.status(500).render('error', { message: 'Internal Server Error' });
    }
};

const isBan = async (req, res, next) => {
    try {
        const ID = req.session?.user?.id;

        if (!ID) {
            return res.redirect('/login'); 
        }

        const user = await usermodel.findOne({ _id: ID });

        if (!user) {
            console.warn(`User with ID ${ID} not found.`);
            return res.redirect('/login'); 
        }

        if (user?.isBlock) {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                    return next(err); 
                }
                res.render('user/login', { message: ['You have been blocked'] });
            });
        } else {
            next();
        }
    } catch (error) {
        console.error('Error in isBan middleware:', error);
        res.status(500).render('error', { message: 'Internal Server Error' });
    }
};

module.exports = { checkSession, isLogin, isBan };
