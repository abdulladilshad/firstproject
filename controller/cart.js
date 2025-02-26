
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

        // Extract product details with variants
        const cartItems = cart.items.map(item => {
            const product = item.productId;
            if (!product) return null;

            return {
                productId: product._id,
                name: product.productName, // Product Name
                price: product.price,
                stock: product.variants?.length > 0 ? product.variants[0].quantity : 0,
                quantity: item.quantity, // Cart quantity
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

        const { productId } = req.body;
        const product = await productModel.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        let cart = await cartModel.findOne({ userId });
        if (!cart) {
            cart = new cartModel({ userId, items: [{ productId, quantity: 1 }] });
        } else {
            const existingItem = cart.items.find(item => item.productId.equals(productId));
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.items.push({ productId, quantity: 1 });
            }
        }

        await cart.save();

        res.json({ success: true, message: 'Item added to cart', cart });

    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

const removeCart = async (req, res) => {
    try {
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




module.exports = {
    LoadCart,
    addCart,
    removeCart,
    getCartItems

}