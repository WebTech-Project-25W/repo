const express = require('express');
const router = express.Router();
const pool = require('../pool.js');

// GET /customer/restaurants
router.get('/restaurants', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, cuisine FROM restaurant ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// GET /customer/restaurants/:id/menu
router.get('/restaurants/:id/menu', async (req, res) => {
  const restaurantId = req.params.id;

  try {
    const result = await pool.query(
      `
      SELECT d.dishid, d.name, d.description, d.price
      FROM dish d
      JOIN menu m ON d.menuid = m.menuid
      WHERE m.restaurantid = $1
      ORDER BY d.name
      `,
      [restaurantId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Menu fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// POST /customer/orders
router.post('/orders', async (req, res) => {

  const restaurantId = req.body.restaurantId;
  const items = req.body.items;

  const customerEmail = req.user.email;
  const status = 'pending';

  try {
    const orderResult = await pool.query(
      `
      INSERT INTO "Order" (customeremail, restaurantid, status)
      VALUES ($1, $2, $3)
      RETURNING orderid
      `,
      [customerEmail, restaurantId, status]
    );

    const orderId = orderResult.rows[0].orderid;

    for (const item of items) {
      await pool.query(
        `
        INSERT INTO orderitem (orderid, dishid, quantity, unitprice)
        VALUES ($1, $2, $3, $4)
        `,
        [
          orderId,
          item.dishId,
          item.quantity,
          item.price
        ]
      );
    }

    logOrder(orderId, status, customerEmail);

    res.json({ message: 'Order created', orderId });
  } catch (err) {
    console.error('Order creation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /customer/orders
router.get('/orders', async (req, res) => {
  const customerEmail = req.user.email;

  try {
    const result = await pool.query(
      `
      SELECT
        o.orderid,
        o.status,
        r.name AS restaurantname,
        SUM(oi.quantity * oi.unitprice) AS total
      FROM "Order" o
      JOIN restaurant r ON o.restaurantid = r.id
      JOIN orderitem oi ON oi.orderid = o.orderid
      WHERE o.customeremail = $1
      GROUP BY o.orderid, o.status, r.name
      ORDER BY o.orderid DESC
      `,
      [customerEmail]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Fetch orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /customer/orders/:id  (Order Details)
router.get('/orders/:id', async (req, res) => {
  const customerEmail = req.user.email;
  const orderId = req.params.id;

  try {
    const result = await pool.query(
      `
      SELECT
        d.name,
        oi.quantity,
        oi.unitprice,
        (oi.quantity * oi.unitprice) AS subtotal
      FROM orderitem oi
      JOIN dish d ON oi.dishid = d.dishid
      JOIN "Order" o ON o.orderid = oi.orderid
      WHERE o.orderid = $1
        AND o.customeremail = $2
      `,
      [orderId, customerEmail]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Fetch order details error:', err);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// GET /customer/profile
router.get('/profile', async (req, res) => {
  const email = req.user.email;

  try {
    const result = await pool.query(
      `
      SELECT
        u.email,
        u.firstname,
        u.lastname,
        c.address,
        c.phonenumber
      FROM appuser u
      LEFT JOIN customer c ON c.email = u.email
      WHERE u.email = $1
      `,
      [email]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Fetch profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});


// PUT /customer/profile
router.put('/profile', async (req, res) => {
  const email = req.user.email;
  const { firstname, lastname, address, phonenumber } = req.body;

  try {
    await pool.query(
      `
      UPDATE appuser
      SET firstname = $1,
          lastname = $2
      WHERE email = $3
      `,
      [firstname, lastname, email]
    );

    await pool.query(
      `
      UPDATE customer
      SET address = $1,
          phonenumber = $2
      WHERE email = $3
      `,
      [address, phonenumber, email]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});



module.exports = router;

async function logOrder(orderId, status, changedBy) {
  const query = `
    INSERT INTO OrderHistory (orderId, status, changedBy)
    VALUES ($1, $2, $3)`;
  await pool.query(query, [orderId, status, changedBy]);
}