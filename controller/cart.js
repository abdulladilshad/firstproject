const productModel = require('../models/product')
const cartModel = require('../models/cartModel')
const Wishlist = require('../models/wishlistModel');

const LoadCart = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        if (!userId) return res.status(401).json({ message: 'User not logged in' });

        const cart = await cartModel.findOne({ userId }).populate('items.productId');

        if (!cart) {
            return res.render('user/cart', { cart: [], totalOfferDiscount: 0 });
        }

        let totalOfferDiscount = 0; // Initialize total discount amount

        const cartItems = cart.items.map(item => {
            const product = item.productId;
            if (!product) return null;

            const discountedPrice = product.price - (product.price * product.offer) / 100;
            const itemDiscount = (product.price - discountedPrice) * item.quantity;
            totalOfferDiscount += itemDiscount; // Add discount per item to total

            return {
                productId: product._id,
                name: product.productName,
                price: product.price,  // Original price
                discountedPrice: discountedPrice,  // Offer price
                color: item.color,
                stock: product.variants?.length > 0 ? product.variants[0].quantity : 0,
                quantity: item.quantity,
            };
        }).filter(item => item !== null);

        res.render('user/cart', { cart: cartItems, totalOfferDiscount });

    } catch (error) {
        console.error('Error loading cart:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const addCart = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        if (!userId) return res.status(401).json({ message: 'User not logged in' });

        const { productId, color } = req.body;
        console.log(color, 'Selected Color');

        if (!color) return res.status(400).json({ message: 'Color is required' });

        const product = await productModel.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        let cart = await cartModel.findOne({ userId });

        if (!cart) {
            
            cart = new cartModel({ 
                userId, 
                items: [{ productId, color, quantity: 1 }] 
            });
        } else {
            
            const existingItem = cart.items.find(item => 
                item.productId.equals(productId) && item.color === color
            );

            if (existingItem) {
                existingItem.quantity += 1; 
            } else {
                
                cart.items.push({ productId, color, quantity: 1 });
            }
        }

        await cart.save();

        
      
        const wishlist = await Wishlist.findOne({ user: userId });
        
        if (wishlist) {
            
            const itemIndex = wishlist.items.findIndex(item => 
                item.product.toString() === productId && item.color === color
            );
            
            if (itemIndex !== -1) {
                wishlist.items.splice(itemIndex, 1);
                await wishlist.save();
            }
        }

        res.json({ success: true, message: 'Item added to cart', cart });

    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const removeCart = async (req, res) => {
    try {
        console.log("remov3e acratfhvdhwikv");
        
        const userId = req.session.user?.id;
        if (!userId) return res.status(401).json({ message: 'User not logged in' });

        const { productId } = req.params;

        const cart = await cartModel.findOne({ userId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        
        const itemIndex = cart.items.findIndex(item => item.productId.equals(productId));
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item does not exist in cart' }); 
        }

        
        cart.items.splice(itemIndex, 1);
        await cart.save();

        res.json({ message: 'Item removed from cart', cart });

    } catch (error) {
        console.error('Error removing item:', error);
        res.status(500).json({ message: 'Internal Server Error' }); 
    }
};

const getCartItems = async (req, res) => {
    try {
        const carts = await cartModel.find().populate('items.productId');
        res.json(carts);
    } catch (error) {
        console.error('Error fetching cart items:', error);
        res.status(500).json({ message: 'Error fetching cart items' });
    }
};

const updateQuatity = async (req, res) => {
    try {
        const { productId } = req.params;
        const { change } = req.body;
        const userId = req.session.user.id;

        console.log('Update Request:', { productId, change, userId }); // Add logging

        // Find the cart and populate product details
        const cart = await cartModel.findOne({ userId }).populate('items.productId');
        if (!cart) {
            console.log('Cart not found');
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Find the cart item
        const cartItem = cart.items.find(i => i.productId._id.toString() === productId);
        if (!cartItem) {
            console.log('Product not in cart');
            return res.status(404).json({ message: 'Product not in cart' });
        }

        // Get the product details
        const product = await productModel.findById(productId);
        if (!product) {
            console.log('Product not found');
            return res.status(404).json({ message: 'Product not found' });
        }

        console.log('Product found:', {
            productId: product._id,
            variants: product.variants,
            cartItemColor: cartItem.color
        });

        // Find the variant that matches the cart item's color
        const variant = product.variants.find(v => v.color === cartItem.color);
        if (!variant) {
            console.log('Variant not found for color:', cartItem.color);
            return res.status(400).json({ 
                message: 'Product variant not found',
                currentStock: 0
            });
        }

        // Calculate new quantity
        const newQuantity = cartItem.quantity + parseInt(change);
        console.log('Quantity calculation:', {
            current: cartItem.quantity,
            change,
            new: newQuantity,
            availableStock: variant.quantity
        });

        // Validate minimum quantity
        if (newQuantity < 1) {
            return res.status(400).json({ 
                message: 'Quantity cannot be less than 1',
                currentStock: variant.quantity
            });
        }

        // Validate against available stock
        if (newQuantity > variant.quantity) {
            return res.status(400).json({ 
                message: `Only ${variant.quantity} items available in stock`,
                currentStock: variant.quantity
            });
        }

        // Update quantity
        cartItem.quantity = newQuantity;
        await cart.save();

        console.log('Cart updated successfully');

        res.json({ 
            success: true, 
            newQuantity,
            currentStock: variant.quantity,
            message: 'Cart updated successfully'
        });

    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ 
            message: 'Error updating cart',
            error: error.message 
        });
    }
};

const checkStock = async (req, res) => {
    try {
        const { productId } = req.params;
        const { color } = req.body;
        
        if (!req.session.user) {
            return res.status(401).json({ 
                success: false,
                message: 'Please login to continue' 
            });
        }

        const userId = req.session.user.id;

        // Get product with populated variants
        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ 
                success: false,
                message: 'Product not found' 
            });
        }

        // Find the specific variant
        const variant = product.variants.find(v => v.color === color);
        if (!variant) {
            return res.status(404).json({ 
                success: false,
                message: 'Product variant not found' 
            });
        }

        // Get current cart quantity
        const cart = await cartModel.findOne({ userId });
        let currentCartQuantity = 0;

        if (cart) {
            const cartItem = cart.items.find(item => 
                item.productId.toString() === productId && 
                item.color === color
            );
            currentCartQuantity = cartItem ? cartItem.quantity : 0;
        }

        // Get actual stock from variant
        const availableStock = variant.quantity;

        console.log('Stock Check:', {
            availableStock,
            currentCartQuantity,
            remainingStock: availableStock - currentCartQuantity
        });

        res.status(200).json({
            success: true,
            availableStock: availableStock,
            currentCartQuantity: currentCartQuantity,
            remainingStock: availableStock - currentCartQuantity,
            message: 'Stock check successful'
        });

    } catch (error) {
        console.error('Error checking stock:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error checking stock availability',
            error: error.message 
        });
    }
};

const addToCart = async (req, res) => {
    try {
        const { productId, color, quantity = 1 } = req.body; // Default quantity to 1 if not provided
        
        if (!req.session.user) {
            return res.status(401).json({ 
                success: false,
                message: 'Please login to continue' 
            });
        }

        const userId = req.session.user.id;

        // Get product details
        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ 
                success: false,
                message: 'Product not found' 
            });
        }

        // Find the variant
        const variant = product.variants.find(v => v.color === color);
        if (!variant) {
            return res.status(404).json({ 
                success: false,
                message: 'Product variant not found' 
            });
        }

        // Get or create cart
        let cart = await cartModel.findOne({ userId });
        if (!cart) {
            cart = new cartModel({ userId, items: [] });
        }

        // Find existing item in cart
        const existingItem = cart.items.find(item => 
            item.productId.toString() === productId && 
            item.color === color
        );

        // Calculate new quantity
        const newQuantity = existingItem 
            ? existingItem.quantity + parseInt(quantity)
            : parseInt(quantity);

        // Check stock availability
        if (newQuantity > variant.quantity) {
            return res.status(400).json({ 
                success: false,
                message: `Only ${variant.quantity} items available in stock`,
                availableStock: variant.quantity
            });
        }

        if (existingItem) {
            existingItem.quantity = newQuantity;
        } else {
            cart.items.push({
                productId,
                color,
                quantity: parseInt(quantity)
            });
        }

        await cart.save();

        // Get updated cart with populated product details
        const updatedCart = await cartModel.findOne({ userId })
            .populate('items.productId', 'productName price imagePaths');

        res.status(200).json({
            success: true,
            message: 'Product added to cart successfully',
            cart: updatedCart,
            currentStock: variant.quantity - newQuantity
        });

    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error adding product to cart',
            error: error.message 
        });
    }
};

module.exports = {
    LoadCart,
    addCart,
    removeCart,
    getCartItems,
    updateQuatity,
    checkStock,
    addToCart
}