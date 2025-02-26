const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    addressId: { type: mongoose.Schema.Types.ObjectId, ref: "Address" },
    paymentMethod: String,
    totalAmount: Number,
    status: { type: String, default: "Pending" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);
