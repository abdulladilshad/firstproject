const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    address: {
        fullName: String,
        phone: String,
        street: String,
        city: String,
        state: String,
        zipCode: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    couponCode: {
        type: String,
        default: "0"
    },
    paymentMethod: String,
    totalAmount: Number,
    offer: {
        type: Number,
        default: 0
    },
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            quantity: Number,
            price: Number,
            status: { type: String, default: "Pending" },
            paymentStatus: { type: String, default: "Pending" },
            color: { type: String },

            productImg: { type: String },
            productName: { type: String }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
