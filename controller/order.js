const OrderModel = require("../models/orderModel");
const cartModel = require("../models/cartModel");

// const orderHistory = async (req, res) => {
//     try {        
//         const userId = req.session.user.id;

//         // Fetch user's orders with product details
//         const orders = await OrderModel.find({ userId })
//             .populate("products.productId")
//             .sort({ createdAt: -1 })  // Show latest orders first

//             console.log(orders, 'kokokkok');

//         if (!orders || orders.length === 0) {
//             return res.render("user/ordersHistory", { orders: [], message: "No orders found" });
//         }
        

//         res.render("user/ordersHistory", { orders, message: null });
//     } catch (error) {
//         console.error(error);
//         res.status(500).render("error", { message: "Error fetching orders" });
//     }
// };


const orderHistory = async (req, res) => {
    try {        
        const userId = req.session.user.id;

        // Fetch user's orders with product details
        const orders = await OrderModel.find({ userId })
            .populate("products.productId")
            .sort({ createdAt: -1 }); // Show latest orders first

        if (!orders || orders.length === 0) {
            return res.render("user/ordersHistory", { orders: [], message: "No orders found" });
        }

        // Convert each product into an individual order entry
        const individualOrders = orders.flatMap(order => 
            order.products.map(product => ({
                orderId: order._id,
                productId: product.productId._id,
                productName: product.productId.productName,
                productImage: product.productId.imagePaths[0], // Adjust based on your schema
                quantity: product.quantity,
                price: product.price,
                status: product.status,
                createdAt: order.createdAt,
                paymentMethod: order.paymentMethod,
                totalAmount: order.totalAmount
            }))
        );

        console.log(individualOrders, 'individualOrdersindividualOrdersindividualOrdersv');
        

        res.render("user/ordersHistory", { orders: individualOrders, message: null });

    } catch (error) {
        console.error(error);
        res.status(500).render("error", { message: "Error fetching orders" });
    }
};




const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { addressId, paymentMethod, total } = req.body;

        console.log(req.body, 'ppppppppppppp');
        
        const cartData = await cartModel.findOne({ userId }).populate("items.productId");

        if (!cartData || cartData.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        const products = cartData.items.map(item => ({
            productId: item.productId._id,
            quantity: item.quantity,
            price: item.productId.price 
        }));

        const totalPrice = total;

        const newOrder = new OrderModel({
            userId,
            addressId,
            paymentMethod,
            totalAmount: totalPrice,
            products,
            status: "Pending"
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

module.exports = {
    placeOrder,
    orderSuccess,
    orderHistory
};
