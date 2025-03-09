const addressModel = require("../models/addressModel");
const cartModel = require("../models/cartModel");
const crypto = require('crypto');
const OrderModel = require("../models/orderModel");
const Product = require("../models/product");

const getCheckout = async (req, res) => {
    try {
        if (!req.session.user) {
            console.log("User not logged in");
            return res.status(401).json({ message: "User not logged in" });
        }

        const userId = req.session.user.id; 

        
        const cartData = await cartModel.findOne({ userId }).populate("items.productId", "productName price imagePaths");

        const addresses = await addressModel.find({ userId });

        
        const cart = cartData
            ? cartData.items.map(item => ({
                cartId: item._id,
                productName: item.productId.productName,
                price: item.productId.price,
                quantity: item.quantity,
                color: item.color, 
                image: item.productId.imagePaths?.[0] || ""
            }))
            : [];

        
        const selectedAddress = addresses.find(addr => addr.isDefault) || addresses[0];


        const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const tax = subtotal * 0.1;
        const total = subtotal + tax;

        
        res.render("user/checkout", { cart, addresses, subtotal, tax, total, selectedAddress });

    } catch (error) {
        console.error("Error in getCheckout:", error);
        res.status(500).json({ message: "Error loading checkout page" });
    }
};

const verifyRazorpayPayment = async (req, res) => {
    try {
        const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        
        // Verify signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');
            
        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Invalid payment signature' });
        }
        
        // Update order status
        const order = await OrderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        // Update order with payment details
        order.paymentId = razorpay_payment_id;
        
        // Update product inventory and status
        for (const product of order.products) {
            product.status = "Confirmed";
            
            // Update product inventory
            const productDoc = await Product.findById(product.productId);
            if (productDoc) {
                const variantIndex = productDoc.variants.findIndex(v => v.color === product.color);
                if (variantIndex !== -1) {
                    productDoc.variants[variantIndex].quantity -= product.quantity;
                    await productDoc.save();
                }
            }
        }
        
        await order.save();
        
        // Clear cart
        await cartModel.deleteOne({ userId: order.userId });
        
        res.status(200).json({ 
            success: true, 
            message: 'Payment verified successfully',
            orderId: order._id
        });
        
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ message: 'Failed to verify payment', error: error.message });
    }
};

module.exports = {
    getCheckout,
    verifyRazorpayPayment
};
