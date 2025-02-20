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
    isdelete:{
      type:Boolean,
      default:false,
    }
  },
  {
    timestamps: true, 
  }
);

const     Category = mongoose.model('Category', categorySchema);

module.exports = Category;
