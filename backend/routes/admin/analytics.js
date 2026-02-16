const express = require('express');
const router = express.Router();
const pool = require('../../pool.js');

// prefix '/admin/analytics'

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

router.get('/accumulative-fees', async (req, res) => {
  try {
    const query = `
      With DailyRevenue AS (
	      SELECT DATE(oh.time) AS order_date,
        SUM(
          CASE
            WHEN o.serviceFeeType = 'cents' THEN o.serviceFee / 100.0
            WHEN o.serviceFeeType = 'percent' THEN (items.subtotal * (o.serviceFee / 100.0))
            ELSE 0 
          END
        ) AS daily_sum
        FROM orderHistory AS oh 
        JOIN "Order" AS o ON oh.orderid = o.orderid
        JOIN (
          SELECT orderID, SUM(quantity * unitprice) AS subtotal FROM orderitem
          GROUP BY orderID
        ) items ON items.orderID = o.orderID
        WHERE oh.status = 'delivered'
        GROUP BY DATE(oh.time)
      )
      SELECT 
        order_date,
        daily_sum,
        SUM(daily_sum) OVER (ORDER BY order_date)
      FROM DailyRevenue
      ORDER BY order_date
    `;

    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

module.exports = router;