const express = require('express');
const router = express.Router();
const pool = require('../../pool.js');

// prefix 'admin/analytics/'

router.get('/key-stats', async (req, res) => {
  try {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM "Order") as "totalOrders",
        (SELECT SUM(unitPrice * quantity) FROM OrderItem) as "revenueCents",
        (SELECT COUNT(*) FROM LogInHistory WHERE status = 'Success') as "totalLogins",
        (SELECT SUM(quantity) FROM OrderItem oi 
         JOIN "Order" o ON oi.orderID = o.orderID 
         WHERE o.status = 'delivered') as "totalMealsDelivered"
    `;
    const results = await pool.query(query);
    res.json(results.rows[0]); // Returns { totalOrders: X, revenueCents: Y, ... }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;