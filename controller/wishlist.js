const User = require('../models/usermodel');
const Wishlist = require('../models/wishlistModel');
const Product = require('../models/product');


const getWishlist = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 6; 
        const skip = (page - 1) * limit;

        let wishlist = await Wishlist.findOne({ user: req.session.user.id })
            .populate({
                path: 'items.product',
                select: 'productName price imagePaths brand'
            });

        if (!wishlist) {
            wishlist = { items: [] };
        }

       
        const paginatedItems = wishlist.items.slice(skip, skip + limit);

        res.render('user/wishlist', {
            wishlist: { items: paginatedItems },
            currentPage: page,
            totalPages: Math.ceil(wishlist.items.length / limit)
        });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch wishlist' });
    }
};



const addToWishlist = async (req, res) => {
    try {
        const { productId, color } = req.body;
        const userId = req.session.user.id;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

       
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        
        const Cart = require('../models/cartModel');
        const cart = await Cart.findOne({ userId });

        if (cart) {
            const inCart = cart.items.some(item =>
                item.productId.toString() === productId && item.color === color
            );

            if (inCart) {
                return res.status(200).json({
                    success: false,
                    message: 'Item is already in your cart'
                });
            }
        }

        
        let wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            wishlist = new Wishlist({
                user: userId,
                items: []
            });
        }

        
        const existingItem = wishlist.items.find(item =>
            item.product.toString() === productId && item.color === color
        );

        if (existingItem) {
            return res.status(200).json({ success: true, message: 'Item is already in your wishlist' });
        }

        
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