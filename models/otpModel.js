const mongoose = require('mongoose');


const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 30 } 
},
{
    timeseries:true,
}
);


otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 });

const Otp = mongoose.model('Otp', otpSchema);
module.exports = Otp;
