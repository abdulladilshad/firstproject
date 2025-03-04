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
      ref: 'Category', 
      required: true,
    },
    imagePaths: {
      type: [String],  
      required: true,   
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
          min: 0, 
        },
      },
    ],
    stock: {
      type: Number,
      required: true,
      default: 0
    },
    isListed: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true, 
  }
);

productSchema.plugin(mongoosePaginate);
const Product = mongoose.model('Product', productSchema);

module.exports = Product;
