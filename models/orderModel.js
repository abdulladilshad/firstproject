const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    addressId: { type: mongoose.Schema.Types.ObjectId, ref: "Address" },
        userId: {
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
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
