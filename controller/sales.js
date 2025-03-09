const Order = require('../models/orderModel');

const salesController = async (req, res) => {
    try {
        let query = {};
        let period = req.query.period || 'daily';

        // Get current date and convert to UTC
        const currentDate = new Date();
        currentDate.setUTCHours(0, 0, 0, 0);

        let startDate, endDate;

        switch (period) {
            case 'daily':
                startDate = new Date(currentDate);
                endDate = new Date(currentDate);
                endDate.setUTCHours(23, 59, 59, 999);
                break;

            case 'weekly':
                startDate = new Date(currentDate);
                startDate.setDate(currentDate.getDate() - 7); // Last 7 days
                startDate.setUTCHours(0, 0, 0, 0);
                endDate = new Date(currentDate);
                endDate.setUTCHours(23, 59, 59, 999);
                break;

            case 'monthly':
                startDate = new Date(currentDate);
                startDate.setDate(currentDate.getDate() - 30); // Last 30 days
                startDate.setUTCHours(0, 0, 0, 0);
                endDate = new Date(currentDate);
                endDate.setUTCHours(23, 59, 59, 999);
                break;

            case 'yearly':
                startDate = new Date(currentDate);
                startDate.setDate(currentDate.getDate() - 365); // Last 365 days
                startDate.setUTCHours(0, 0, 0, 0);
                endDate = new Date(currentDate);
                endDate.setUTCHours(23, 59, 59, 999);
                break;

            default:
                if (req.query.startDate && req.query.endDate) {
                    startDate = new Date(req.query.startDate);
                    endDate = new Date(req.query.endDate);

                    if (isNaN(startDate) || isNaN(endDate)) {
                        console.error("Invalid Date Inputs");
                        return res.status(400).send("Invalid date format");
                    }

                    startDate.setUTCHours(0, 0, 0, 0);
                    endDate.setUTCHours(23, 59, 59, 999);
                } else {
                    startDate = new Date(currentDate);
                    endDate = new Date(currentDate);
                    endDate.setUTCHours(23, 59, 59, 999);
                    period = 'daily';
                }
        }

        // Add date range and status to query
        query.createdAt = { $gte: startDate, $lte: endDate };

        console.log('Querying Orders from:', startDate.toISOString(), 'to', endDate.toISOString());

        const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
        console.log(`Orders Found: ${orders.length}`);

        // Calculate total sales only for delivered products
        const totalSales = orders.reduce((sum, order) => {
            return sum + (order.products?.reduce((itemSum, item) => {
                if (item.status === 'Delivered') {
                    return itemSum + ((item.price * item.quantity) || 0);
                }
                return itemSum;
            }, 0) || 0);
        }, 0);

        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : 0;
        const productsSold = orders.reduce((sum, order) => {
            return sum + (order.products?.reduce((itemSum, item) => {
                if (item.status === 'Delivered') {
                    return itemSum + (item.quantity || 0);
                }
                return itemSum;
            }, 0) || 0);
        }, 0);

        const formattedOrders = orders.map(order => ({
            orderId: order._id.toString().slice(-6).toUpperCase(),
            date: order.createdAt.toISOString().split('T')[0], 
            customerName: order.address?.fullName || 'Guest',
            productCount: order.products?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
            totalAmount: order.products?.reduce((sum, item) => sum + ((item.price * item.quantity) || 0), 0) || 0,
            status: order.products?.map(product => product.status).join(', ') || 'Pending'
        }));

        res.render('admin/sales', {
            totalSales,
            totalOrders,
            avgOrderValue,
            productsSold,
            orders: formattedOrders,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            selectedPeriod: period
        });

    } catch (error) {
        console.log('Error in sales report:', error);
        res.status(500).send("Error generating sales report");
    }
};

module.exports = { salesController };
