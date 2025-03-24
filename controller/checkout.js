const addressModel = require("../models/addressModel");
const cartModel = require("../models/cartModel");
const walletModel = require("../models/walletModel");
const crypto = require('crypto');
const OrderModel = require("../models/orderModel");
const Product = require("../models/product");
const categoryModel = require('../models/categories');
const couponModel =require("../models/couponModel")
const Coupon = require("../models/couponModel");
const mongoose = require('mongoose');

const getCheckout = async (req, res) => {
    try {
        if (!req.session.user) {
            console.log("User not logged in");
            return res.status(401).json({ message: "User not logged in" });
        }

        const userId = req.session.user.id; 
        const wallet = await walletModel.findOne({user:userId})
        const cartData = await cartModel.findOne({ userId }).populate("items.productId", "productName price offer imagePaths category");
        const addresses = await addressModel.find({ userId });

        const cart = [];
        if (cartData) {
            for (const item of cartData.items) {
                const originalPrice = item.productId.price;
                
               
                const category = await categoryModel.findById(item.productId.category);
                const categoryOffer = category ? category.offer || 0 : 0;
                const productOffer = item.productId.offer || 0;

               
                const applicableOffer = Math.max(categoryOffer, productOffer);
                const discountedPrice = originalPrice - (originalPrice * applicableOffer / 100);

                cart.push({
                    cartId: item._id,
                    productName: item.productId.productName,
                    price: originalPrice,
                    discountedPrice: discountedPrice,
                    offer: applicableOffer,
                    quantity: item.quantity,
                    color: item.color,
                    image: item.productId.imagePaths?.[0] || ""
                });
            }
        }

        const selectedAddress = addresses.find(addr => addr.isDefault) || addresses[0];
        
        // Get only valid coupons (not expired and not used by this user)
        const coupons = await couponModel.find({
            isActive: true,
            expirationDate: { $gt: new Date() },
            usedBy: { $ne: userId } // exclude coupons already used by this user
        });
        
        const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const totalDiscount = cart.reduce((acc, item) => 
            acc + ((item.price - item.discountedPrice) * item.quantity), 0);
        const discountedSubtotal = subtotal - totalDiscount;
        const tax = discountedSubtotal * 0.1;
        const total = discountedSubtotal + tax;

        res.render("user/checkout", { 
            cart, 
            addresses, 
            subtotal, 
            totalDiscount,
            discountedSubtotal,
            tax, 
            total, 
            selectedAddress, 
            wallet,
            coupons
        });

    } catch (error) {
        console.error("Error in getCheckout:", error);
        res.status(500).json({ message: "Error loading checkout page" });
    }
};

const verifyRazorpayPayment = async (req, res) => {
    try {
        const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        
        
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');
            
        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Invalid payment signature' });
        }
        
        
        const order = await OrderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
       
        order.paymentId = razorpay_payment_id;
        
        
        for (const product of order.products) {
            product.paymentStatus = "Paided";
            
           
            const productDoc = await Product.findById(product.productId);
            if (productDoc) {
                const variantIndex = productDoc.variants.findIndex(v => v.color === product.color);
                if (variantIndex !== -1) {
                    productDoc.variants[variantIndex].quantity -= product.quantity;
                    await productDoc.save();
                }
            }
        }
        
        await order.save();
        
       
        await cartModel.deleteOne({ userId: order.userId });
        
        res.status(200).json({ 
            success: true, 
            message: 'Payment verified successfully',
            orderId: order._id
        });
        
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ message: 'Failed to verify payment', error: error.message });
    }
};


const applyCoupon = async (req, res) => {
    try {
        const { couponCode, subtotal } = req.body;
        const userId = req.session?.user?.id; 

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

      
        const coupon = await Coupon.findOne({
            code: couponCode.toUpperCase(),
            isActive: true,
            expirationDate: { $gt: new Date() }
        });

      
        if (!coupon) {
            return res.status(400).json({ message: 'Invalid or expired coupon code' });
        }

        
        if (coupon.usedBy.includes(userId)) {
            return res.status(400).json({ message: 'You have already used this coupon' });
        }

        
        if (subtotal < coupon.minPurchase) {
            return res.status(400).json({
                message: `Minimum purchase amount of ₹${coupon.minPurchase} required`
            });
        }

        
        let discountAmount = (subtotal * coupon.discount) / 100;

        if (coupon.maxDiscount) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        }

        
        const newSubtotal = subtotal - discountAmount;
        const newTax = newSubtotal * 0.1; 
        const newTotal = newSubtotal + newTax;

        
        coupon.usedBy.push(userId);
        coupon.usedCount += 1;

        await coupon.save();

  
        req.session.appliedCoupon = {
            code: coupon.code,
            discountAmount: discountAmount
        };

 
        res.json({
            success: true,
            discountAmount,
            totalDiscount: discountAmount,
            newTotal,
            message: 'Coupon applied successfully'
        });

    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ message: 'Error applying coupon' });
    }
};
const addAddress = async (req, res) => {
    try {
        const { fullName, phone, street, city, state, zipCode } = req.body;
        
        if (!req.session.user || !req.session.user.id) {
            return res.status(401).json({
                success: false,
                message: 'User not logged in'
            });
        }
        
        // Create new address
        const address = new addressModel({
            userId: req.session.user.id, // Fixed: using id instead of _id
            fullName,
            phone,
            street,
            city,
            state,
            zipCode,
            isDefault: false
        });

        // Check if this is the user's first address
        const addressCount = await addressModel.countDocuments({ userId: req.session.user.id });
        if (addressCount === 0) {
            address.isDefault = true;
        }

        // Save the address
        await address.save();

        res.status(201).json({
            success: true,
            message: 'Address added successfully',
            address: address
        });

    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add address',
            error: error.message
        });
    }
};







module.exports = {
    getCheckout,
    verifyRazorpayPayment,
    applyCoupon,
    addAddress
};
