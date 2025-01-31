const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true, // Removes extra spaces
    lowercase: true // Converts email to lowercase
  },
  // phone:{
  //   type:String,
  //   unique:true,
  //   sparse:true,
  //   default:null
  // },
  googleId:{
    type:String,
    unique:true
  },
  password: {
    type: String,
    required: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'], // Restricts role to 'user' or 'admin'
    default: 'user' // Default role is 'user'
  },
  isBlock:{
    type:Boolean,
    default:false
  },
 
  createdAt: {
    type: Date,
    default: Date.now
  },
  
});

// Exporting the model
module.exports = mongoose.model('User', userSchema);