const OrderModel = require("../models/orderModel");

// const adminOrders = async (req, res) => {
//     try {
//         // Fetch all orders, populate product details and user details
//         const orders = await OrderModel.find()
//             .populate("userId", "name email") // Assuming user model has name and email
//             .populate("products.productId")
//             .sort({ createdAt: -1 });

//         console.log("Admin Order Data:", orders);
//         res.render("admin/orderMangement", { orders });
//     } catch (error) {
//         console.error("Error fetching admin orders:", error);
//         res.status(500).render("error", { message: "Error fetching orders" });
//     }
// };


const adminOrders = async (req, res) => {
    try {
        // Fetch all orders with populated details
        const orders = await OrderModel.find()
            .populate("userId", "name email") // Get user details
            .populate("products.productId")  // Get product details
            .sort({ createdAt: -1 });


        const individualOrders = [];

        orders.forEach(order => {
            order.products.forEach(product => {
                individualOrders.push({
                    orderId: order._id,
                    userId: order.userId,
                    paymentMethod: order.paymentMethod,
                    productId: product.productId._id,
                    productName: product.productId.name, // Assuming Product model has name
                    quantity: product.quantity,
                    price: product.price,
                    status: product.status,
                    createdAt: order.createdAt
                });
            });
        });


        // Send transformed data to the view
        res.render("admin/orderMangement", { orders: individualOrders });

    } catch (error) {
        console.error("Error fetching admin orders:", error);
        res.status(500).render("error", { message: "Error fetching orders" });
    }
};


const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body; // Expecting a status like "Confirmed", "Shipped", "Delivered"

        await OrderModel.findByIdAndUpdate(orderId, { status });

        res.redirect("/admin/orders");
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ message: "Error updating order status" });
    }
};

module.exports = {
    adminOrders,
    updateOrderStatus
};
