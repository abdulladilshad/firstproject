

const userModel = require('../models/usermodel');

const getProfile = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        if (!userId) return res.redirect('/login');

        const user = await userModel.findById(userId);
        if (!user) return res.redirect('/login');

        res.render('user/profile', { user });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).send('Internal Server Error');
    }
};

const updateProfile = async (req, res) => {
    try {

        
        const userId = req.session.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'User not logged in' });

        const { name, email } = req.body;
        let updateData = { name, email };

        const currentUser = await userModel.findById(userId);
        
     
        if (req.file) {
            currentUser.image = `/uploads/${req.file.filename}`;
            currentUser.save()
        } else if (currentUser.googleId) {
           
            updateData.image = currentUser.picture; 
            
            
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            userId, 
            updateData, 
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ 
            success: true, 
            name: updatedUser.name, 
            email: updatedUser.email, 
            avatar: updatedUser.avatar || updatedUser.picture 
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

module.exports = { getProfile, updateProfile };
