const OrderModel = require("../models/orderModel");
const cartModel = require("../models/cartModel");

const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { addressId, paymentMethod } = req.body;

        const cartData = await cartModel.findOne({ userId });

        if (!cartData) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        const totalPrice = cartData.totalPrice;

        const newOrder = new OrderModel({
            userId,  // Store user ID
            addressId,
            paymentMethod,
            totalAmount: totalPrice
        });

        await newOrder.save();

        await cartModel.deleteOne({ userId });  

        res.status(201).json({ orderId: newOrder._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error placing order" });
    }
};

const orderSuccess = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await OrderModel.findById(orderId);

        if (!order) {
            return res.status(404).render('orderSuccess', { error: 'Order not found' });
        }

        res.render('user/order', { orderId: order._id, totalAmount: order.totalAmount });
    } catch (error) {
        console.error(error);
        res.status(500).render('orderSuccess', { error: 'Error loading order details' });
    }
};

module.exports = {
    placeOrder,
    orderSuccess
};
