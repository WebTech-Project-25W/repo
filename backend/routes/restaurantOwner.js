const express = require('express');
const router = express.Router();
const pool = require('../pool');


// =====================================================
// GET my restaurant
// =====================================================
router.get('/restaurant', async (req, res) => {
  const ownerUsername = req.user.username;

  try {
    const result = await pool.query(
      'SELECT * FROM Restaurant WHERE ownerUsername = $1',
      [ownerUsername]
    );

    res.json({ restaurant: result.rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load restaurant' });
  }
});


// =====================================================
// CREATE my restaurant (only once)
// =====================================================
router.post('/restaurant', async (req, res) => {
  const ownerUsername = req.user.username;
  const { street, number, postcode, region, phoneNum } = req.body;

  try {
    const existing = await pool.query(
      'SELECT 1 FROM Restaurant WHERE ownerUsername = $1',
      [ownerUsername]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Restaurant already exists' });
    }

    await pool.query(
      `INSERT INTO Restaurant
       (ownerUsername, approvalStatus, street, streetNumber, postcode, region, phoneNum)
       VALUES ($1, 'pending', $2, $3, $4, $5, $6)`,
      [ownerUsername, street, number, postcode, region, phoneNum]
    );

    res.json({ message: 'Restaurant created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create restaurant' });
  }
});


// =====================================================
// CREATE menu
// =====================================================
router.post('/menus', async (req, res) => {
  const ownerUsername = req.user.username;
  const { name, description } = req.body;

  try {
    const restaurant = await pool.query(
      'SELECT restaurantID FROM Restaurant WHERE ownerUsername = $1',
      [ownerUsername]
    );

    if (restaurant.rows.length === 0) {
      return res.status(400).json({ message: 'Create restaurant first' });
    }

    await pool.query(
      'INSERT INTO Menu (restaurantID, name, description) VALUES ($1,$2,$3)',
      [restaurant.rows[0].restaurantid, name, description]
    );

    res.json({ message: 'Menu created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create menu' });
  }
});


// =====================================================
// GET my menus
// =====================================================
router.get('/menus', async (req, res) => {
  const ownerUsername = req.user.username;

  try {
    const result = await pool.query(
      `SELECT m.*
       FROM Menu m
       JOIN Restaurant r ON r.restaurantID = m.restaurantID
       WHERE r.ownerUsername = $1`,
      [ownerUsername]
    );

    res.json({ menus: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load menus' });
  }
});


// =====================================================
// CREATE dish
// =====================================================
router.post('/dishes', async (req, res) => {
  const { menuID, name, description, price, photoLink } = req.body;

  try {
    await pool.query(
      `INSERT INTO Dish (menuID, name, description, price, photoLink)
       VALUES ($1,$2,$3,$4,$5)`,
      [menuID, name, description, price, photoLink]
    );

    res.json({ message: 'Dish created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create dish' });
  }
});


// =====================================================
// GET dishes by menu
// =====================================================
router.get('/dishes/:menuID', async (req, res) => {
  const { menuID } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM Dish WHERE menuID = $1',
      [menuID]
    );

    res.json({ dishes: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load dishes' });
  }
});


// =====================================================
// GET orders for my restaurant
// =====================================================
router.get('/orders', async (req, res) => {
  const ownerUsername = req.user.username;

  try {
    const result = await pool.query(
      `SELECT o.orderID, o.status, o.createdAt
       FROM OrderTable o
       JOIN Restaurant r ON r.restaurantID = o.restaurantID
       WHERE r.ownerUsername = $1
       ORDER BY o.createdAt DESC`,
      [ownerUsername]
    );

    res.json({ orders: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load orders' });
  }
});


// =====================================================
// UPDATE order status (accept → preparing → ready → dispatched / reject)
// =====================================================
router.put('/orders/:orderID/status', async (req, res) => {
  const ownerUsername = req.user.username;
  const { orderID } = req.params;
  const { status } = req.body;

  const allowedStatuses = [
    'accepted',
    'rejected',
    'preparing',
    'ready',
    'dispatched'
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const result = await pool.query(
      `UPDATE OrderTable o
       SET status = $1
       FROM Restaurant r
       WHERE o.orderID = $2
         AND o.restaurantID = r.restaurantID
         AND r.ownerUsername = $3
       RETURNING o.orderID, o.status`,
      [status, orderID, ownerUsername]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      message: 'Order status updated',
      order: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});


// =====================================================
// UPDATE restaurant opening hours & delivery zone
// =====================================================
router.put('/restaurant/settings', async (req, res) => {
  const ownerUsername = req.user.username;
  const { openingHours, deliveryZone } = req.body;

  try {
    const result = await pool.query(
      `UPDATE Restaurant
       SET openingHours = $1,
           deliveryZone = $2
       WHERE ownerUsername = $3
       RETURNING restaurantID, openingHours, deliveryZone`,
      [openingHours, deliveryZone, ownerUsername]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.json({
      message: 'Restaurant settings updated',
      restaurant: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update restaurant settings' });
  }
});


// =====================================================
// ANALYTICS: daily & weekly order counts
// =====================================================
router.get('/analytics/orders', async (req, res) => {
  const ownerUsername = req.user.username;

  try {
    const result = await pool.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE o.createdAt::date = CURRENT_DATE) AS today,
        COUNT(*) FILTER (WHERE o.createdAt >= CURRENT_DATE - INTERVAL '7 days') AS thisWeek
      FROM OrderTable o
      JOIN Restaurant r ON r.restaurantID = o.restaurantID
      WHERE r.ownerUsername = $1
      `,
      [ownerUsername]
    );

    res.json({
      today: Number(result.rows[0].today),
      thisWeek: Number(result.rows[0].thisweek)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load order analytics' });
  }
});


// =====================================================
// ANALYTICS: most ordered dishes
// =====================================================
router.get('/analytics/top-dishes', async (req, res) => {
  const ownerUsername = req.user.username;

  try {
    const result = await pool.query(
      `
      SELECT d.name, COUNT(*) AS count
      FROM OrderItem oi
      JOIN Dish d ON d.dishID = oi.dishID
      JOIN OrderTable o ON o.orderID = oi.orderID
      JOIN Restaurant r ON r.restaurantID = o.restaurantID
      WHERE r.ownerUsername = $1
      GROUP BY d.name
      ORDER BY count DESC
      LIMIT 5
      `,
      [ownerUsername]
    );

    res.json({ topDishes: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load dish analytics' });
  }
});

module.exports = router;
