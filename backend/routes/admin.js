const express = require('express');
const router = express.Router();
const pool = require('../pool.js');

const userRoutes = require('./admin/users.js');
router.use('/users', userRoutes);

const restaurantRoutes = require('./admin/restaurants.js')
router.use('/restaurants', restaurantRoutes);

const logRoutes = require('./admin/logs.js');
router.use('/logs', logRoutes);

const analyticsRoutes = require('./admin/analytics.js');
router.use('/analytics', analyticsRoutes);

const voucherRoutes = require('./admin/vouchers.js');
router.use('/vouchers', voucherRoutes);

const deliveryZoneRoutes = require('./admin/deliveryZones.js')
router.use('/delivery-zones', deliveryZoneRoutes);

const profileRoutes = require('./admin/profile.js');
router.use('/profile', profileRoutes);

module.exports = router;