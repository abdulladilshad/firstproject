const addressModel = require("../models/addressModel");
const cartModel = require("../models/cartModel");

const getCheckout = async (req, res) => {
    try {
        if (!req.session.user) {
            console.log("User not logged in");
            return res.status(401).json({ message: "User not logged in" });
        }

        const userId = req.session.user.id; // Ensure user ID is correctly extracted
        

        // Fetch cart and addresses
        const cartData = await cartModel.findOne({ userId }).populate("items.productId", "productName price imagePaths");

        const addresses = await addressModel.find({ userId });

 
        // Transform cartData to required format
        const cart = cartData
            ? cartData.items.map(item => ({
                cartId: item._id,
                productName: item.productId.productName,
                price: item.productId.price,
                quantity: item.quantity,
                image: item.productId.imagePaths?.[0] || ""
            }))
            : [];


            
        // Select default address or first one
        const selectedAddress = addresses.find(addr => addr.isDefault) || addresses[0];

        // Calculate totals
        const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const tax = subtotal * 0.1;
        const total = subtotal + tax;

        // Render the checkout page
        res.render("user/checkout", { cart, addresses, subtotal, tax, total, selectedAddress });

    } catch (error) {
        console.error("Error in getCheckout:", error);
        res.status(500).json({ message: "Error loading checkout page" });
    }
};

module.exports = {
    getCheckout
};
