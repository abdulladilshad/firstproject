const Order = require('../models/orderModel');
const mongoose = require('mongoose');
const { login } = require('./admin');

const salesController = async (req, res) => {
    try {
        let query = {};
        let period = req.query.period || 'daily';
        let searchQuery = req.query.search;
        
        
        if (searchQuery) {
            searchQuery = searchQuery.trim();
            query.$or = [
                { '_id': { $regex: searchQuery, $options: 'i' } },
                { 'address.fullName': { $regex: searchQuery, $options: 'i' } },
                { 'totalAmount': searchQuery.replace(/[^0-9.]/g, '') ? Number(searchQuery.replace(/[^0-9.]/g, '')) : null }
            ];
        }
       
        const page = parseInt(req.query.page) || 1;
        const limit = 7; 
        const skip = (page - 1) * limit;

        
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
                startDate.setDate(currentDate.getDate() - 7); 
                startDate.setUTCHours(0, 0, 0, 0);
                endDate = new Date(currentDate);
                endDate.setUTCHours(23, 59, 59, 999);
                break;

            case 'monthly':
                startDate = new Date(currentDate);
                startDate.setDate(currentDate.getDate() - 30); 
                startDate.setUTCHours(0, 0, 0, 0);
                endDate = new Date(currentDate);
                endDate.setUTCHours(23, 59, 59, 999);
                break;

            case 'yearly':
                startDate = new Date(currentDate);
                startDate.setDate(currentDate.getDate() - 365); 
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

       
        query.createdAt = { $gte: startDate, $lte: endDate };

        console.log('Querying Orders from:', startDate.toISOString(), 'to', endDate.toISOString());
        if (searchQuery) console.log('Search Query:', searchQuery);

       
        const totalOrders = await Order.countDocuments(query);
        const totalPages = Math.ceil(totalOrders / limit);

        
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        console.log(`Orders Found: ${orders.length}`);

        
        const totalSales = orders.reduce((sum, order) => {
            return sum + (order.products?.reduce((itemSum, item) => {
                if (item.status === 'Delivered') {
                    return itemSum + ((item.price * item.quantity) || 0);
                }
                return itemSum;
            }, 0) || 0);
        }, 0);

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
            totalAmount: order.totalAmount,
            paymentMethord:order.paymentMethod,
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
            selectedPeriod: period,
            currentPage: page,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            nextPage: page + 1,
            prevPage: page - 1,
            lastPage: totalPages,
            limit: limit,
            searchQuery: searchQuery || ''
        });

        
        
    } catch (error) {
        console.log('Error in sales report:', error);
        res.status(500).send("Error generating sales report");
    }
};

const searchOrders = async (req, res) => {
    try {
        let query = {};
        let searchQuery = req.query.search;
        let period = req.query.period || 'daily';
        
        
        if (searchQuery) {
            searchQuery = searchQuery.trim();
            query.$or = [
                { 'address.fullName': { $regex: searchQuery, $options: 'i' } }
            ];

            
            const numericSearch = searchQuery.replace(/[^0-9.]/g, '');
            if (numericSearch) {
                
                query.$or.push({ 'totalAmount': Number(numericSearch) });
                
                
                try {
                    
                    const ordersWithMatchingId = await Order.find({
                        _id: { 
                            $in: (await Order.find({}, '_id'))
                                .filter(order => 
                                    order._id.toString().slice(-6).includes(numericSearch)
                                )
                                .map(order => order._id)
                        }
                    }).select('_id');

                    if (ordersWithMatchingId.length > 0) {
                        query.$or.push({ 
                            '_id': { 
                                $in: ordersWithMatchingId.map(order => order._id) 
                            } 
                        });
                    }
                } catch (err) {
                    console.error('Error searching by OrderId:', err);
                }
            }
        }

        const currentDate = new Date();
        currentDate.setUTCHours(0, 0, 0, 0);

        let startDate, endDate;

        
        if (req.query.startDate && req.query.endDate) {
            startDate = new Date(req.query.startDate);
            endDate = new Date(req.query.endDate);
            
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return res.status(400).json({ 
                    error: 'Invalid date format',
                    message: 'Please provide valid dates'
                });
            }
            
            startDate.setUTCHours(0, 0, 0, 0);
            endDate.setUTCHours(23, 59, 59, 999);
        } else {
            switch (period) {
                case 'daily':
                    startDate = new Date(currentDate);
                    endDate = new Date(currentDate);
                    endDate.setUTCHours(23, 59, 59, 999);
                    break;
                case 'weekly':
                    startDate = new Date(currentDate);
                    startDate.setDate(currentDate.getDate() - 7);
                    endDate = new Date(currentDate);
                    endDate.setUTCHours(23, 59, 59, 999);
                    break;
                case 'monthly':
                    startDate = new Date(currentDate);
                    startDate.setDate(currentDate.getDate() - 30);
                    endDate = new Date(currentDate);
                    endDate.setUTCHours(23, 59, 59, 999);
                    break;
                case 'yearly':
                    startDate = new Date(currentDate);
                    startDate.setDate(currentDate.getDate() - 365);
                    endDate = new Date(currentDate);
                    endDate.setUTCHours(23, 59, 59, 999);
                    break;
                default:
                    startDate = new Date(currentDate);
                    endDate = new Date(currentDate);
                    endDate.setUTCHours(23, 59, 59, 999);
            }
        }

        
        query.createdAt = { $gte: startDate, $lte: endDate };

        console.log('Search Query:', JSON.stringify(query, null, 2));

        
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .lean();

        console.log(`Found ${orders.length} orders`);

        
        const totalSales = orders.reduce((sum, order) => {
            return sum + (order.totalAmount || 0);
        }, 0);

        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : 0;
        const productsSold = orders.reduce((sum, order) => {
            return sum + (order.products?.reduce((itemSum, item) => {
                return itemSum + (item.quantity || 0);
            }, 0) || 0);
        }, 0);

        
        const formattedOrders = orders.map(order => ({
            orderId: order._id.toString().slice(-6).toUpperCase(),
            date: order.createdAt.toISOString().split('T')[0],
            customerName: order.address?.fullName || 'Guest',
            productCount: order.products?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
            totalAmount: order.totalAmount || 0,
            status: order.products?.map(product => product.status).join(', ') || 'Pending'
        }));

        
        res.json({
            orders: formattedOrders,
            stats: {
                totalSales,
                totalOrders,
                avgOrderValue,
                productsSold
            }
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            error: 'Error searching orders',
            message: error.message || 'An unexpected error occurred'
        });
    }
};

module.exports = { 
    salesController,
    searchOrders 
};
