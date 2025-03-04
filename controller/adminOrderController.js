const OrderModel = require("../models/orderModel");
const productModel = require("../models/product")
const mongoose = require('mongoose');


const adminOrders = async (req, res) => {
    try {


         const orders = await OrderModel.find()
            .populate("userId", "name email") 
            .populate("products.productId")  
            .sort({ createdAt: -1 });


        const individualOrders = [];

        orders.forEach(order => {
            order.products.forEach(product => {
                individualOrders.push({
                    orderId: order._id,
                    userId: order.userId,
                    paymentMethod: order.paymentMethod,
                    productId: product.productId._id,
                    productName: product.productId.name,
                    quantity: product.quantity,
                    price: product.price,
                    color: product.color,
                    status: product.status,
                    createdAt: order.createdAt,
                    IndividualOrderId: product._id,
                });
            });
        });

        

        
        res.render("admin/orderMangement", { orders: individualOrders ,individualOrders});

    } catch (error) {
        console.error("Error fetching admin orders:", error);
        res.status(500).render("error", { message: "Error fetching orders" });
    }
};


const updateOrderStatus = async (req, res) => {
    try {
        const { status , orderId, productId } = req.body        


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
        console.log("qqqqqqqqqqqqqq" ,req.query);
        const {individualOrderId,orderId} = req.query

        console.log('ssssssssssssssssssss',orderId);
        


        const orders = await OrderModel.find({_id:orderId

        })
            .sort({ createdAt: -1 })
            .populate('userId', 'name email');

            console.log(orders, 'opopopopopopo');

            const order = orders[0]; 
            const product = order?.products.find(p => p._id.toString() === individualOrderId) || null;
            

            const productSchema = await productModel.findOne({ _id: new mongoose.Types.ObjectId(product.productId) });
            
         console.log("lllllllllllllllllllllll",product);
         

        res.render('admin/orderView', {
            orders,
            product,
            productSchema,
            title: 'Order Management'
        });
    } catch (error) {
        console.log("inside the catch ",error);
        
        res.redirect('/admin/dashboard');
    }
}

const a = async (req, res) => {
    console.log("wwwwwwwwwwwwww");

    const { orderId, individualOrderId } = req.query;

    try {
        // Find the order using orderId
        const order = await OrderModel.findById(orderId)
            .populate('userId', 'name email phone') // Populate user details
            .populate('products.productId', 'productName imagePaths'); // Populate product details

            console.log(order, 'from erreoe');
        if (!order) {

            return res.status(404).json({ message: 'Order not found' });
        }

        
        const individualOrder = order.products.find(
            (item) => item._id.toString() === individualOrderId
        );
        console.log(individualOrder, 'from erreoe');


        if (!individualOrder) {
            return res.status(404).json({ message: 'Individual order not found' });
        }
        

        res.json(individualOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }

};

const b = async (req, res) => {
    try {
        console.log("Fetching order details for:", req.params.id);

        const orders = await OrderModel.findById(req.params.id)
            .populate('user', 'name email phone') 
            .populate('items.product', 'name price image  ');

        if (!order) {
            req.flash('error', 'Order not found');
            return res.redirect('/admin/orders');
        }

        console.log("Order Retrieved:", order); // Debugging

        res.render('admin/order-details', { 
           orders, 
            title: `Order #${order._id} Details` 
        });
    } catch (error) {
        console.error("Error fetching order:", error);
        req.flash('error', 'Error fetching order: ' + error.message);
        res.redirect('/admin/orders');
    }
}

module.exports = {
    adminOrders,
    updateOrderStatus, orderView,
    a, b
};
