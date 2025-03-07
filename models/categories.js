const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },

    offer: {
      type: Number, // Store offer as a percentage (0-100)
      min: 0,
      max: 100,
      default: 0, // Default means no discount
    },
    isdelete: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
