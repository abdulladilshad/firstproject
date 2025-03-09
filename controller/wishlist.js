const User = require('../models/usermodel');
const Wishlist = require('../models/wishlistModel');
const Product = require('../models/product');

// Get user's wishlist
const getWishlist = async (req, res) => {
    try {
        let wishlist = await Wishlist.findOne({ user: req.session.user.id })
            .populate({
                path: 'items.product',
                select: 'productName price imagePaths brand'
            });

        if (!wishlist) {
            wishlist = { items: [] };
        }

        res.render('user/wishlist', { wishlist });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch wishlist' });
    }
};

// Add item to wishlist
const addToWishlist = async (req, res) => {
    try {
        const { productId, color } = req.body;
        
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        console.log('jjmjmjmjmjmjmjmjmjmjmjmjm',req.session.user.id);
        
        // Find user's wishlist or create a new one
        let wishlist = await Wishlist.findOne({ user: req.session.user.id });
        
        if (!wishlist) {
            wishlist = new Wishlist({
                user: req.session.user.id,
                items: []
            });
        }

        // Check if product is already in wishlist
        const existingItem = wishlist.items.find(item => 
            item.product.toString() === productId && item.color === color
        );

        if (existingItem) {
            return res.status(200).json({ success: true, message: 'Item is already in your wishlist' });
        }

        // Add item to wishlist
        wishlist.items.push({
            product: productId,
            color: color
        });

        await wishlist.save();
        
        res.status(200).json({ success: true, message: 'Item added to wishlist' });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({ success: false, message: 'Failed to add item to wishlist' });
    }
};

// Remove item from wishlist
const removeFromWishlist = async (req, res) => {
    try {
        const { itemId } = req.params;
        
        const result = await Wishlist.updateOne(
            { user: req.session.user.id },
            { $pull: { items: { _id: itemId } } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ success: false, message: 'Item not found in wishlist' });
        }

        res.status(200).json({ success: true, message: 'Item removed from wishlist' });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ success: false, message: 'Failed to remove item from wishlist' });
    }
};



module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist
}