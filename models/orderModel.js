const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    address: {
        fullName: String,
        phone: String,
        street: String,
        city: String,
        state: String,
        zipCode: String
    },        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
    paymentMethod: String,
    totalAmount: Number,
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            quantity: Number,
            price: Number,
            status: { type: String, default: "Pending" },
            color: { type: String },
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
