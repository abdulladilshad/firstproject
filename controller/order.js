const OrderModel = require("../models/orderModel");
const cartModel = require("../models/cartModel");
const mongoose = require("mongoose");
const addressModel = require('../models/addressModel')



const orderHistory = async (req, res) => {
    try {        
        const userId = req.session.user.id;

   
        const orders = await OrderModel.find({ userId })
            .populate("products.productId")
            .sort({ createdAt: -1 }); 

        if (!orders || orders.length === 0) {
            return res.render("user/ordersHistory", { orders: [], message: "No orders found" });
        }

        const individualOrders = orders.flatMap(order => 
            order.products.map(product => ({
                orderId: order._id,
                productId: product.productId._id,
                productName: product.productId.productName,
                productImage: product.productId.imagePaths[0], 
                quantity: product.quantity,
                price: product.price,
                status: product.status,
                color: product.color,
                createdAt: order.createdAt,
                paymentMethod: order.paymentMethod,
                totalAmount: order.totalAmount,
                individualOrdersId: product._id,
            }))
        );

        
        res.render("user/ordersHistory", { orders: individualOrders, message: null });

    } catch (error) {
        console.error(error);
        res.status(500).render("error", { message: "Error fetching orders" });
    }
};




const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { addressId, paymentMethod, total, newAddress } = req.body;

        const cartData = await cartModel.findOne({ userId }).populate("items.productId");

        if (!cartData || cartData.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }


        let selectedAddress;
        if (addressId) {
            
            const address = await addressModel.findById(addressId);
            if (!address) {
                return res.status(400).json({ message: "Invalid address" });
            }
            selectedAddress = {
                fullName: address.fullName,
                phone: address.phone,
                street: address.street,
                city: address.city,
                state: address.state,
                zipCode: address.zipCode
            };
        } else if (newAddress) {

            console.log("Saving new address hhhhhhhhhhhhhhhhhhhhhhhhhhh:", newAddress);
            
            try {
                const savedAddress = new addressModel({ userId, ...newAddress });
                await savedAddress.save();
            } catch (error) {
                console.error("Address Save Error:", error);
                return res.status(500).json({ message: "Failed to save address", error });
            }
        } else {
            return res.status(400).json({ message: "Address is required" });
        }

        const products = [];

        for (let item of cartData.items) {
            const product = item.productId;
            const orderedColor = item.color;

       
            const variantIndex = product.variants.findIndex(v => v.color === orderedColor);

            if (variantIndex !== -1) {
                if (product.variants[variantIndex].quantity < item.quantity) {
                    return res.status(400).json({ message: `Not enough stock for ${product.productName} in ${orderedColor}` });
                }
                product.variants[variantIndex].quantity -= item.quantity;
            } else {
                return res.status(400).json({ message: `Color ${orderedColor} not found for ${product.productName}` });
            }
console.log(selectedAddress, 'selectedAddressselectedAddress');

            await product.save();

            products.push({
                productId: product._id,
                quantity: item.quantity,
                price: product.price,
                color: orderedColor
            });
        }

        const newOrder = new OrderModel({
            userId,
            address: selectedAddress || newAddress, 
            paymentMethod,
            totalAmount: total,
            products,
            status: "Pending"
        });

        console.log(newOrder, 'newwwwwwwwwwwwwww ');
        
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
        const order = await OrderModel.findById(orderId).populate("products.productId");

        if (!order) {
            return res.status(404).render("orderSuccess", { error: "Order not found" });
        }

        res.render("user/order", { 
            orderId: order._id, 
            totalAmount: order.totalAmount,
            products: order.products 
        });
    } catch (error) {
        console.error(error);
        res.status(500).render("orderSuccess", { error: "Error loading order details" });
    }
};
const cancelOrder = async (req, res) => {
    try {
        const { individualOrdersId, orderId } = req.query;
        

        
        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ success: false, message: "Invalid or missing orderId" });
        }

        if (!individualOrdersId || !mongoose.Types.ObjectId.isValid(individualOrdersId)) {
            return res.status(400).json({ success: false, message: "Invalid or missing productId" });
        }

       

  
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        }


        const updatedOrder = await OrderModel.findOneAndUpdate(
            { _id: orderId, "products._id": individualOrdersId }, 
            { $set: { "products.$.status": "Cancelled" } },
            { new: true }
        );
        
        console.log(updatedOrder, 'iaoioaiosiaois');
        

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order or product not found" });
        }

        res.redirect("/orders");

    } catch (error) {
        console.error("Error cancelling order:", error);
        res.status(500).json({ success: false, message: "Error cancelling order" });
    }
};



module.exports = {
    placeOrder,
    orderSuccess,
    orderHistory,
    cancelOrder
};
