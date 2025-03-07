const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    offerType: {
      type: String,
      enum: ['product', 'category', 'referral'], // Offer applies to Product, Category, or Referral
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product', // Reference if it's a Product offer
      default: null,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category', // Reference if it's a Category offer
      default: null,
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer;
