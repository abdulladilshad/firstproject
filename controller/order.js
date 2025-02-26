const OrderModel= require("../models/orderModel");
const cartModel = require("../models/cartModel");

const placeOrder = async (req, res) => {
    try {
        const { addressId, paymentMethod } = req.body;
        const cart = await cartModel.find();

        const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const tax = subtotal * 0.1;
        const total = subtotal + tax + 10;

        const newOrder = new OrderModel({ addressId, paymentMethod, totalAmount: total });
        await newOrder.save();

        await cartModel.deleteMany(); // Clear cart after order

        res.status(201).json({ orderId: newOrder._id });
    } catch (error) {
        res.status(500).json({ message: "Error placing order" });
    }
};

module.exports = {
    placeOrder
}