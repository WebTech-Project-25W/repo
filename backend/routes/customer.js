const express = require('express');
const router = express.Router();
const pool = require('../pool.js');
const ETA_RULES = {
  A: { A: 20, B: 30, C: 40 },
  B: { A: 30, B: 20, C: 35 },
  C: { A: 40, B: 35, C: 25 },
};


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

  const orderTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

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

    let pointsEarned = Math.floor(orderTotal / 10);

    const today = new Date();
    const isWeekend = today.getDay() === 0 || today.getDay() === 6;
    if (isWeekend) {
      pointsEarned *= 2;
    }

    await pool.query(
      `
      UPDATE customer
      SET points = points + $1
      WHERE email = $2
      `,
      [pointsEarned, customerEmail]
    );

    logOrder(orderId, status, customerEmail);

    res.json({
      message: 'Order created',
      orderId,
      pointsEarned
    });

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

// GET /customer/orders/:id  (Order Details + ETA info)
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
        (oi.quantity * oi.unitprice) AS subtotal,
        r.deliveryzone AS restaurant_zone,
        c.deliveryzone AS customer_zone
      FROM orderitem oi
      JOIN dish d ON oi.dishid = d.dishid
      JOIN "Order" o ON o.orderid = oi.orderid
      JOIN restaurant r ON o.restaurantid = r.id
      JOIN customer c ON o.customeremail = c.email
      WHERE o.orderid = $1
        AND o.customeremail = $2
      `,
      [orderId, customerEmail]
    );

    if (result.rows.length === 0) {
      return res.json({ items: [], eta: null });
    }

    const { restaurant_zone, customer_zone } = result.rows[0];

    const baseEta =
      ETA_RULES[customer_zone]?.[restaurant_zone] ?? 30;

    res.json({
      items: result.rows.map(r => ({
        name: r.name,
        quantity: r.quantity,
        unitprice: r.unitprice,
        subtotal: r.subtotal,
      })),
      eta: `${baseEta}–${baseEta + 10} min`,
    });
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
        c.phonenumber,
        c.points
      FROM appuser u
      LEFT JOIN customer c ON c.email = u.email
      WHERE u.email = $1
      `,
      [email]
    );

    res.json({
    profile: {
    firstName: result.rows[0]?.firstname || '',
    lastName: result.rows[0]?.lastname || '',
    phone: result.rows[0]?.phonenumber || '',
    address: result.rows[0]?.address || '',
    points: result.rows[0]?.points ?? 0
  }
});
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

// POST rating for a restaurant
router.post("/ratings/restaurant", async (req, res) => {
  const { restaurantId, rating } = req.body;
  const customerEmail = req.user.email;

  if (!restaurantId || !rating) {
    return res.status(400).json({ error: "restaurantId and rating are required" });
  }

  try {
    let statsQuery;
    let statsParams;

   await pool.query(
  `
  INSERT INTO ratings (customeremail, restaurantid, rating)
  VALUES ($1, $2, $3)
  ON CONFLICT (customeremail, restaurantid)
  WHERE restaurantid IS NOT NULL
  DO UPDATE
  SET rating = EXCLUDED.rating
  `,
  [customerEmail, restaurantId, rating]
);



    statsQuery = `
      SELECT
        ROUND(AVG(rating)::numeric, 1) AS average,
        COUNT(*) AS count
      FROM ratings
      WHERE restaurantId = $1
    `;
    statsParams = [restaurantId];

    const stats = await pool.query(statsQuery, statsParams);

    res.json({
      average: Number(stats.rows[0].average) || 0,
      count: Number(stats.rows[0].count) || 0,
    });
  } catch (err) {
    console.error("Failed to save restaurant rating", err);
    res.status(500).json({ error: "Failed to save restaurant rating" });
  }
});

// POST rating for a dish
router.post("/ratings/dish", async (req, res) => {
  const { dishId, rating } = req.body;
  const customerEmail = req.user.email;

  if (!dishId || !rating) {
    return res.status(400).json({ error: "dishId and rating required" });
  }

  try {
    const existing = await pool.query(
      `SELECT id FROM ratings
       WHERE customeremail = $1 AND dishid = $2`,
      [customerEmail, dishId]
    );

    if (existing.rowCount > 0) {
      await pool.query(
        `UPDATE ratings
         SET rating = $3
         WHERE customeremail = $1 AND dishid = $2`,
        [customerEmail, dishId, rating]
      );
    } else {
      await pool.query(
        `INSERT INTO ratings (customeremail, dishid, rating)
         VALUES ($1, $2, $3)`,
        [customerEmail, dishId, rating]
      );
    }

    res.json({ message: "Dish rating saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save dish rating" });
  }
});

// POST textual review
router.post("/reviews", async (req, res) => {
  const { restaurantId, rating, description } = req.body;
  const customerEmail = req.user.email;

  if (!restaurantId || !rating) {
    return res.status(400).json({
      error: "restaurantId and rating are required",
    });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      error: "rating must be between 1 and 5",
    });
  }

  const timestamp = new Date();

  try {
    await pool.query(
      `
      INSERT INTO review (restaurantid, customeremail, rating, description, timestamp)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [restaurantId, customerEmail, rating, description || null, timestamp]
    );

    res.json({ message: "Review saved successfully" });
  } catch (err) {
    console.error("Failed to save review error:", err);
    res.status(500).json({ error: "Failed to save review" });
  }
});

// POST voucher
router.post("/voucher", async (req, res) => {
  const { code, orderTotal } = req.body;

  if (!code || !orderTotal || orderTotal <= 0) {
    return res.status(400).json({
      valid: false,
      message: "Invalid request data"
    });
  }

  try {
    const result = await pool.query(
      "SELECT discount_percent, is_active FROM vouchers WHERE code = $1",
      [code]
    );

    if (result.rows.length === 0) {
      return res.json({
        valid: false,
        message: "Voucher not found"
      });
    }

    const voucher = result.rows[0];

    if (!voucher.is_active) {
      return res.json({
        valid: false,
        message: "Voucher is inactive"
      });
    }

    const discountAmount =
      (orderTotal * voucher.discount_percent) / 100;

    const finalTotal =
      Math.max(orderTotal - discountAmount, 0);

    res.json({
      valid: true,
      discountPercent: voucher.discount_percent,
      discountAmount: Number(discountAmount.toFixed(2)),
      finalTotal: Number(finalTotal.toFixed(2))
    });

  } catch (err) {
    console.error("Voucher validation error:", err);
    res.status(500).json({
      valid: false,
      message: "Server error while validating voucher"
    });
  }
});

// POST /customer/loyalty/redeem
router.post('/loyalty/redeem', async (req, res) => {
  const customerEmail = req.user.email;
  const { voucherCode } = req.body;

  let pointsCost;
  if (voucherCode === 'FOOD5') {
    pointsCost = 5;
  } else if (voucherCode === 'FOOD10') {
    pointsCost = 10;
  } else {
    return res.status(400).json({ error: 'Invalid reward' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      'SELECT points FROM Customer WHERE email = $1 FOR UPDATE',
      [customerEmail]
    );

    const currentPoints = result.rows[0].points;

    if (currentPoints < pointsCost) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Not enough points' });
    }

    await client.query(
      'UPDATE Customer SET points = points - $1 WHERE email = $2',
      [pointsCost, customerEmail]
    );

    await client.query(
      `INSERT INTO LoyaltyRedemption
       (customerEmail, voucherCode, pointsSpent)
       VALUES ($1, $2, $3)`,
      [customerEmail, voucherCode, pointsCost]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Reward redeemed successfully',
      voucherCode
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Redeem error:', err.message);
    res.status(500).json({ error: 'Redeem failed' });
  } finally {
    client.release();
  }
});

// GET /customer/loyalty/history
router.get('/loyalty/history', async (req, res) => {
  const customerEmail = req.user.email;

  try {
    const { rows } = await pool.query(
      `
      SELECT
        voucherCode,
        pointsSpent,
        redeemedAt
      FROM LoyaltyRedemption
      WHERE customerEmail = $1
      ORDER BY redeemedAt DESC
      `,
      [customerEmail]
    );

    res.json(rows);
  } catch (err) {
    console.error('Fetch loyalty history error:', err.message);
    res.status(500).json({ error: 'Failed to fetch loyalty history' });
  }
});

module.exports = router;

async function logOrder(orderId, status, changedBy) {
  const query = `
    INSERT INTO OrderHistory (orderId, status, changedBy)
    VALUES ($1, $2, $3)`;
  await pool.query(query, [orderId, status, changedBy]);
}