const OrderModel = require("../models/orderModel");
const productModel = require("../models/product")
const UserModel = require('../models/usermodel')
const mongoose = require('mongoose');
const WalletModel = require('../models/walletModel')
const TransactionModel = require("../models/transactionsModel");

const adminOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const statusFilter = req.query.status || 'all'; 

        
        let query = OrderModel.find();

        
        if (statusFilter !== 'all') {
            query = OrderModel.find({
                "products.status": statusFilter
            });
        }

        const orders = await query
            .populate("userId", "name email")
            .populate("products.productId")
            .sort({ createdAt: -1 });

        const individualOrders = orders.flatMap(order =>
            order.products.map(product => ({
                orderId: order._id,
                fullname: order.address.fullName,
                productId: product.productId?._id || "No ID",
                productName: product.productId?.productName || "No Name",
                productImage: product.productId?.imagePaths?.[0] || "/default.jpg",
                quantity: product.quantity || 0,
                price: product.price || 0,
                status: product.status || "Pending",
                color: product.color || "N/A",
                createdAt: order.createdAt,
                paymentMethod: order.paymentMethod,
                totalAmount: order.totalAmount,
                individualOrdersId: product._id,
            }))
        );

        
        const statusCounts = {
            all: individualOrders.length,
            Pending: individualOrders.filter(o => o.status === 'Pending').length,
            Confirmed: individualOrders.filter(o => o.status === 'Confirmed').length,
            Shipped: individualOrders.filter(o => o.status === 'Shipped').length,
            Delivered: individualOrders.filter(o => o.status === 'Delivered').length,
            Cancelled: individualOrders.filter(o => o.status === 'Cancelled').length,
            Returned: individualOrders.filter(o => o.status === 'Returned').length,
        };

        const totalItems = individualOrders.length;
        const totalPages = Math.ceil(totalItems / limit);
        const paginatedOrders = individualOrders.slice(skip, skip + limit);

        res.render("admin/orderMangement", {
            orders: paginatedOrders,
            individualOrders,
            currentPage: page,
            totalPages: totalPages,
            hasPrevPage: page > 1,
            hasNextPage: page < totalPages,
            prevPage: page - 1,
            nextPage: page + 1,
            totalItems: totalItems,
            statusFilter: statusFilter,
            statusCounts: statusCounts
        });

    } catch (error) {
        console.error("Error fetching admin orders:", error);
        res.status(500).render("admin/orderMangement", {
            message: "Error fetching orders",
            orders: [],
            currentPage: 1,
            totalPages: 1,
            hasPrevPage: false,
            hasNextPage: false,
            prevPage: 1,
            nextPage: 1,
            totalItems: 0,
            statusFilter: 'all',
            statusCounts: {
                all: 0,
                Pending: 0,
                Confirmed: 0,
                Shipped: 0,
                Delivered: 0,
                Cancelled: 0,
                Returned: 0
            }
        });
    }
};



const updateOrderStatus = async (req, res) => {
    try {
        const { status, orderId, productId } = req.body


        const updatedOrder = await OrderModel.findOneAndUpdate(
            { _id: orderId, "products._id": productId },
            { $set: { "products.$.status": status } },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order or product not found" });
        }

        res.json({ success: true, message: "Status updated successfully", newStatus: status });

    } catch (error) {
        console.error("Error updating order:", error);
        res.status(500).json({ success: false, message: "Error updating order status" });
    }
}


const orderView = async (req, res) => {
    try {
        console.log("qqqqqqqqqqqqqq", req.query);
        const { individualOrderId, orderId } = req.query

        console.log('ssssssssssssssssssss', orderId);



        const orders = await OrderModel.find({
            _id: orderId

        })
            .sort({ createdAt: -1 })
            .populate('userId', 'name email');

            
            const order = orders[0];
            console.log(order.products.map(e => e), 'opopopopopopo');
            
        const product = order && order.products 
        ? order.products.find(p => p._id.toString() === individualOrderId.toString()) 
        : null;
    
        console.log(product, 'kkkkkkkkkkk');
        
        const productSchema = await productModel.findOne({ _id: new mongoose.Types.ObjectId(product.productId) });

        console.log("lllllllllllllllllllllll", product);


        res.render('admin/orderView', {
            orders,
            product,
            productSchema,
            title: 'Order Management'
        });
    } catch (error) {
        console.log("inside the catch ", error);

        res.redirect('/admin/orders');
    }
}





const approveReturn = async (req, res) => {
    try {
        const { orderId, productId } = req.params;

       
        const order = await OrderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        console.log("Order Found:", order);

       
        const product = order.products.find(p => p._id.toString() === productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found in order" });
        }

        console.log("Product Found in Order:", product);

       
        if (product.status !== "Returned") {
            return res.status(400).json({ message: "Return request not found or already processed" });
        }

        
        if (!mongoose.Types.ObjectId.isValid(order.userId)) {
            return res.status(400).json({ message: "Invalid User ID" });
        }

        console.log("User ID:", order.userId);

       
        let wallet = await WalletModel.findOne({ user: order.userId });
        if (!wallet) {
            wallet = new WalletModel({
                user: order.userId,
                balance: 0,
            });
        }

        console.log("Wallet Found:", wallet);

        
        const refundAmount =order.totalAmount;

        
        wallet.balance += refundAmount;

        console.log("Updated Wallet Balance:", wallet.balance);

        
        await wallet.save();

        
        const transaction = new TransactionModel({
            user: order.userId,
            wallet: wallet._id,
            type: "returnedFund",
            amount: refundAmount,
            status: "completed",
        });

        await transaction.save();

        console.log("Transaction Created:", transaction);

        
        const productInDB = await productModel.findById(product.productId);
        if (productInDB) {
           
            const variantIndex = productInDB.variants.findIndex(
                (variant) => variant.color === product.color
            );

            if (variantIndex !== -1) {
               
                productInDB.variants[variantIndex].quantity += product.quantity;
                await productInDB.save();
                console.log(`Stock updated: ${productInDB.variants[variantIndex].quantity} units available for color ${product.color}.`);
            } else {
                console.log("Variant not found in database.");
            }
        } else {
            console.log("Product not found in database.");
        }

       
        product.status = "Return Approved";
        await order.save();

        console.log("Return Approved Successfully");

        res.redirect("/admin/orders"); 
    } catch (error) {
        console.error("Error processing return approval:", error);
        res.status(500).json({ message: "Error processing return approval" });
    }
};




const cancelReturn = async (req, res) => {
    try {
        const { orderId, productId } = req.params;

        
        const order = await OrderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        
        const product = order.products.find(p => p._id.toString() === productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found in order" });
        }

        
        if (product.status !== "Returned") {
            return res.status(400).json({ message: "Return request not found or already processed" });
        }

       
        product.status = "Return Canceled";
        await order.save();

        res.redirect("/admin/orders"); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error processing return cancellation" });
    }
};

module.exports = {
    adminOrders,
    updateOrderStatus, orderView,
    approveReturn,
    cancelReturn
};
