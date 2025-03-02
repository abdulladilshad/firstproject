
const productModel = require('../models/product')
const cartModel = require('../models/cartModel')

const LoadCart = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        if (!userId) return res.status(401).json({ message: 'User not logged in' });

        const cart = await cartModel.findOne({ userId }).populate('items.productId');

        if (!cart) {
            return res.render('user/cart', { cart: [] });
        }

        // Extract product details with selected color
        const cartItems = cart.items.map(item => {
            const product = item.productId;
            if (!product) return null;

            return {
                productId: product._id,
                name: product.productName, 
                price: product.price,
                color: item.color, // ✅ Pass the selected color
                stock: product.variants?.length > 0 ? product.variants[0].quantity : 0,
                quantity: item.quantity, 
            };
        }).filter(item => item !== null);

        res.render('user/cart', { cart: cartItems });

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
            // Create a new cart if the user doesn't have one
            cart = new cartModel({ 
                userId, 
                items: [{ productId, color, quantity: 1 }] 
            });
        } else {
            // Check if the exact product with the same color exists
            const existingItem = cart.items.find(item => 
                item.productId.equals(productId) && item.color === color
            );

            if (existingItem) {
                existingItem.quantity += 1; // Increase quantity if same color exists
            } else {
                // Add new item separately if color is different
                cart.items.push({ productId, color, quantity: 1 });
            }
        }

        await cart.save();
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

        // Check if the item exists
        const itemIndex = cart.items.findIndex(item => item.productId.equals(productId));
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item does not exist in cart' }); // ✅ FIXED: Returning JSON
        }

        // Remove item from cart
        cart.items.splice(itemIndex, 1);
        await cart.save();

        res.json({ message: 'Item removed from cart', cart });

    } catch (error) {
        console.error('Error removing item:', error);
        res.status(500).json({ message: 'Internal Server Error' }); // ✅ FIXED: Always JSON response
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


const updateQuatity =  async (req, res) => {
    try {
        const { productId } = req.params;
        const { change } = req.body;
        const userId = req.session.user.id;

        const cart = await cartModel.findOne({ userId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        const item = cart.items.find(i => i.productId.equals(productId));
        if (!item) return res.status(404).json({ message: 'Product not in cart' });

        let newQuantity = item.quantity + change;
        if (newQuantity < 1) newQuantity = 1;
        if (newQuantity > 5) newQuantity = 5;

        item.quantity = newQuantity;
        await cart.save();

        res.json({ success: true, newQuantity });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ message: 'Error updating cart' });
    }
}


module.exports = {
    LoadCart,
    addCart,
    removeCart,
    getCartItems,
    updateQuatity
}