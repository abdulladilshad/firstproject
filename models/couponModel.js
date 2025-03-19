const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    expirationDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > Date.now();
        },
        message: 'Expiration date must be in the future'
      }
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    minPurchase: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number,
      default: Infinity, // Improved logic
    },
    usageLimit: {
      type: Number,
      default: Infinity, // Improved logic
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    usedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [] // Important fix
    }
  },
  { timestamps: true }
);

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
