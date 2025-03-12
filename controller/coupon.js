const Coupon = require('../models/couponModel');





const getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find();
        res.render('admin/coupons', { coupons });
    } catch (error) {
        console.error("Error fetching coupons:", error);
        res.status(500).send("Error fetching coupons");
    }
};


const renderAddCoupon = (req, res) => {
    res.render('admin/addCoupon', { error: "" });
};

const addCoupon = async (req, res) => {
    try {
        const { code, discount, expirationDate, minPurchase, maxDiscount, usageLimit } = req.body;


        if (discount < 0 || discount > 100) {
            return res.render('admin/addCoupon', { error: "Discount must be between 0 and 100." });
        }

        const newCoupon = new Coupon({
            code: code.toUpperCase(),
            discount,
            expirationDate,
            minPurchase,
            maxDiscount,
            usageLimit,
        });

        await newCoupon.save();
        res.redirect('/admin/coupons');
    } catch (error) {
        console.error("Error adding coupon:", error);
        res.status(500).send("Error adding coupon");
    }
};


const renderEditCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).send("Coupon not found");

        res.render('admin/editCoupon', { coupon, error: "" });
    } catch (error) {
        console.error("Error fetching coupon:", error);
        res.status(500).send("Error fetching coupon");
    }
};


const editCoupon = async (req, res) => {
    try {
        const { code, discount, expirationDate, minPurchase, maxDiscount, usageLimit } = req.body;


        if (discount < 0 || discount > 100) {
            return res.render('admin/editCoupon', { coupon: req.body, error: "Discount must be between 0 and 100." });
        }

        await Coupon.findByIdAndUpdate(req.params.id, {
            code: code.toUpperCase(),
            discount,
            expirationDate,
            minPurchase,
            maxDiscount,
            usageLimit,
        });

        res.redirect('/admin/coupons');
    } catch (error) {
        console.error("Error editing coupon:", error);
        res.status(500).send("Error editing coupon");
    }



};

const toggleCouponStatus = async (req, res) => {
    try {
        const couponId = req.params.coupon_id;

       
        const coupon = await Coupon.findOne({ _id: couponId });

        if (!coupon) {
            return res.status(404).json({ success: false, error: 'Coupon not found' });
        }

       
        coupon.isActive = !coupon.isActive;
        await coupon.save();

        res.status(200).json({
            success: true,
            message: coupon.isActive
                ? 'Coupon is now active'
                : 'Coupon is now inactive',
        });
    } catch (err) {
        console.error('Error updating coupon status:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
module.exports = {
    getAllCoupons,
    renderAddCoupon,
    addCoupon,
    renderEditCoupon,
    editCoupon,
    toggleCouponStatus

}