const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
    balance: { type: Number, default: 0 },

});


const Wallet = mongoose.models.Wallet || mongoose.model('Wallet', WalletSchema);

module.exports = Wallet;
