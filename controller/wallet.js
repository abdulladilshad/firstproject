const User = require('../models/usermodel');
const Wallet = require('../models/walletModel')
const Transaction = require('../models/transactionsModel');

const getWallet = async (req, res) => {

    const user = await User.findOne({email:req.session.user.email });

    if (!user) {
        return res.status(404).send('User not found');
    }


    const wallet= await Wallet.findOne({user:user._id})


    res.render('user/wallet', { balance: wallet.balance, transactions: user.transactions });
    
    
};


const deposit = async (req, res) => {
    try {
        const { amount } = req.body;
        const depositAmount = parseFloat(amount);

        if (isNaN(depositAmount) || depositAmount <= 0) {
            return res.status(400).send('Invalid deposit amount');
        }

        // Find the user
        const user = await User.findOne({ email: req.session.user.email });

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Find or create the wallet
        let wallet = await Wallet.findOne({ user: user._id });

        if (!wallet) {
            wallet = new Wallet({
                user: user._id,
                balance: 0
            });
        }

        // Update wallet balance
        wallet.balance += depositAmount;
        await wallet.save();

        // Create a transaction record
        const transaction = new Transaction({
            user: user._id,
            wallet: wallet._id,
            type: 'deposit',
            amount: depositAmount,
            status: 'completed'
        });

        await transaction.save();

        res.redirect('/wallet');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
};



module.exports = {
    getWallet,
    deposit
};
