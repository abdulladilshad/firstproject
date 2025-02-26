require('dotenv').config(); // Load env first
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/usermodel');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    proxy: true // Add this if using reverse proxy (e.g., Nginx)
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ 
            $or: [
                { googleId: profile.id },
                { email: profile.emails[0].value },
                {image: profile.photos[0].value}
            ]
        });


        if (!user) {
            user = new User({
                name: profile.displayName,
                email: profile.emails[0].value,
                image: profile.photos[0].value,
                isVerified: true // Add email verification status
            });
            await user.save();
        }else {
            // Update existing user with Google avatar if not already set
            if (!user.image) {
                user.image = profile.photos[0].value;
                await user.save();
            }
        }
        
        done(null, user);
    } catch (error) {
        done(error, null);
    }
}));

module.exports = passport;