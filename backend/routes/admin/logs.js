const express = require('express');
const router = express.Router();
const pool = require('../../pool.js');

// prefix '/admin/logs'

router.get('/logins', async (req, res) => {
  const { email, status, limit = 50, offset = 0 } = req.query;

  // Start with a base query
  let query = `SELECT *, COUNT(*) OVER() as totalEntries FROM LogInHistory WHERE 1=1`;
  const params = [];

  // Dynamically add filters
  if (email) {
    params.push(`%${email}%`);
    query += ` AND userEmail LIKE $${params.length}`;
  }

  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }

  // Pagination and Ordering
  query += ` ORDER BY time DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  try {
    const results = await pool.query(query, params);

    const totalEntries = results.rows.length > 0 ? parseInt(results.rows[0].totalentries) : 0;

    res.json({
      metadata: {
        totalEntries: totalEntries,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
      data: results.rows.map(row => {
        const { totalEntries, ...data } = row;
        return data;
      })
    });

  } catch (err) {
    res.status(500).send("Server Error");
  }
});

router.get('/orders', async (req, res) => {
  const { orderId, status, restaurant, customerEmail, limit = 50, offset = 0 } = req.query;

  // Start with a base query
  let query = `SELECT 
    oh.id AS history_id,
    oh.orderID,
    oh.time AS status_change_time,
    oh.status AS new_status,
    oh.changedBY,
    o.customerEmail,
    r.name AS restaurant_name,
    o.deliveryAddress,
    COUNT(*) OVER() as totalEntries
    FROM OrderHistory oh
    JOIN "Order" o ON oh.orderID = o.orderID
    JOIN Restaurant r ON o.restaurantID = r.id
    WHERE 1=1`

  const params = [];

  // Dynamically add filters
  if (orderId) {
    params.push(orderId);
    query += ` AND oh.orderid = $${params.length}`;
  }

  if (status) {
    params.push(status);
    query += ` AND oh.status = $${params.length}`;
  }

  if (restaurant) {
    params.push(`%${restaurant}%`);
    query += ` AND r.name LIKE $${params.length}`;
  }

  if (customerEmail) {
    params.push(`%${customerEmail}%`);
    query += ` AND o.customerEmail LIKE $${params.length}`;
  }

  // Pagination and Ordering
  query += ` ORDER BY time DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  try {
    const results = await pool.query(query, params);

    const totalEntries = results.rows.length > 0 ? parseInt(results.rows[0].totalentries) : 0;

    res.json({
      metadata: {
        totalEntries: totalEntries,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
      data: results.rows.map(row => {
        const { totalEntries, ...data } = row;
        return data;
      })
    });

  } catch (err) {
    res.status(500).send("Server Error");
  }
});

module.exports = router;