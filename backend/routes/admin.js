const express = require('express');
const router = express.Router();

const userRoutes = require('./admin/users.js');
const restaurantRoutes = require('./admin/restaurants.js')
const logRoutes = require('./admin/logs.js');
const analyticsRoutes = require('./admin/analytics.js');
const voucherRoutes = require('./admin/vouchers.js');
const deliveryZoneRoutes = require('./admin/deliveryZones.js')
const profileRoutes = require('./admin/profile.js');

router.use('/users', userRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/logs', logRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/vouchers', voucherRoutes);
router.use('/delivery-zones', deliveryZoneRoutes);
router.use('/profile', profileRoutes);

module.exports = router;