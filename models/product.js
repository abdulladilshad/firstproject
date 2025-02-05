const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2')


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
          // Ensures that the array is not empty and all elements are non-empty strings
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
    stock: {
      type: Number,
      min: 0,  // Ensures that stock can't be negative
    },
    color: {
      type: [String], // Array of strings for colors
      required: true, // Make this required if every product must have at least one color
    },
    productDescription: {
      type: String,
      required: true,
      trim: true,
    },
    isDelete: {
      type:Boolean,
      default:false
    },
    material: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

productSchema.plugin(mongoosePaginate);
const Product = mongoose.model('Product', productSchema);


module.exports = Product;
