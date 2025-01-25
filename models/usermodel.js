const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true, // Removes extra spaces
    lowercase: true // Converts email to lowercase
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'], // Restricts role to 'user' or 'admin'
    default: 'user' // Default role is 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Exporting the model
module.exports = mongoose.model('User', userSchema);
