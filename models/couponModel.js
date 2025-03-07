const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true, // Ensures coupon codes are always uppercase
    },
    discount: {
      type: Number, // Percentage discount (0-100)
      required: true,
      min: 0,
      max: 100,
    },
    expirationDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    minPurchase: {
      type: Number,
      default: 0, // Minimum amount required to apply the coupon
    },
    maxDiscount: {
      type: Number, // Maximum discount amount
      default: null,
    },
    usageLimit: {
      type: Number, // How many times the coupon can be used
      default: null, // Null means unlimited
    },
    usedCount: {
      type: Number,
      default: 0, // Track how many times the coupon has been used
    },
  },
  { timestamps: true }
);

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
