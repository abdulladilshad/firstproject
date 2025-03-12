const User = require('../models/usermodel');
const Wallet = require('../models/walletModel')
const Transaction = require('../models/transactionsModel');

const getWallet = async (req, res) => {
    try {
        const user = await User.findOne({email: req.session.user.email});

        if (!user) {
            return res.status(404).send('User not found');
        }

        const wallet = await Wallet.findOne({user: user._id});
        
        if (!wallet) {
            return res.status(404).send('Wallet not found');
        }

        
        const transactions = await Transaction.find({user: user._id})
            .sort({createdAt: -1})
            .lean();

        res.render('user/wallet', { balance: wallet.balance, transactions: transactions });
    } catch (error) {
        console.error('Error fetching wallet:', error);
        res.status(500).send('Internal server error');
    }
};


const deposit = async (req, res) => {
    try {
        const { amount } = req.body;
        const depositAmount = parseFloat(amount);

        if (isNaN(depositAmount) || depositAmount <= 0) {
            return res.status(400).send('Invalid deposit amount');
        }

       
        const user = await User.findOne({ email: req.session.user.email });

        if (!user) {
            return res.status(404).send('User not found');
        }

        
        let wallet = await Wallet.findOne({ user: user._id });

        if (!wallet) {
            wallet = new Wallet({
                user: user._id,
                balance: 0
            });
        }

       
        wallet.balance += depositAmount;
        await wallet.save();

       
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
