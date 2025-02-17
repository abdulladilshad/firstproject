const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category', // References the Category model
      required: true,
    },
    imagePaths: {
      type: [String],  // An array of strings to store image paths
      required: true,   // Ensures that the image array is required
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.trim() !== '');
        },
        message: 'Each image path should be a non-empty string',
      },
    },
    price: {
      type: Number,
      required: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    productDescription: {
      type: String,
      required: true,
      trim: true,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
    material: {
      type: String,
      trim: true,
    },
    variants: [
      {
        color: {
          type: String,
          required: true,
          trim: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 0, // Ensures quantity is not negative
        },
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

productSchema.plugin(mongoosePaginate);
const Product = mongoose.model('Product', productSchema);

module.exports = Product;
