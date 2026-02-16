const express = require('express');
const router = express.Router();
const pool = require('../pool.js');

router.get('/users', async (req, res) => {
  const { role, limit = 50, offset = 0 } = req.query;

  try {
    // validate role input
    const allowedRoles = ['customer', 'restaurantowner', 'sitemanager'];
    const table = role.toLowerCase();

    if (!allowedRoles.includes(table)) {
      return res.status(400).json({ error: "Invalid role provided" });
    }

    const query = {
      // template literal is risky, but the input is being screened before being accepeted
      text: `SELECT u.email, u.firstname, u.lastname, COUNT(*) OVER() as totalEntries
        FROM appuser u JOIN ${role} r on u.email = r.email
        WHERE 1=1`,
      values: []
    };

    const keys = ['email', 'firstName', 'lastName'];
    // dynamic filters
    for (const key of keys) {
      const value = req.query[key];
      if (value) {
        query.values.push(`%${value}%`);
        query.text += ` AND u.${key} ILIKE $${query.values.length}`;
      }
    }

    query.text += ` ORDER BY email DESC LIMIT $${query.values.length + 1} OFFSET $${query.values.length + 2}`;
    query.values.push(limit, offset);


    const results = await pool.query(query);

    const totalEntries = results.rows.length > 0 ? parseInt(results.rows[0].totalentries) : 0;

    res.status(200).json({
      metadata: {
        totalEntries,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
      data: results.rows.map(row => {
        const { totalentries, ...data } = row;
        return data;
      })
    })

  } catch (error) {
    console.error("Error while fetching users:", error.message);
    res.status(500).json({ error: "Error while fetching users: " + error.message });
  }
});

router.get('/customers', async (req, res) => {
  const {
    email, firstName, lastName, status,
    postcode, deliveryZone, limit = 50, offset = 0
  } = req.query;

  // JOIN AppUser and Customer
  // totalEntries is calculated over the filtered results
  let query = `
    SELECT 
      u.email, u.firstname, u.lastname, 
      c.blockedstatus as status, c.address, 
      c.postcode, c.phonenumber as phone, c.deliveryzone, c.points,
      COUNT(*) OVER() as totalEntries
    FROM AppUser u
    JOIN Customer c ON u.email = c.email
    WHERE 1=1`;

  const params = [];

  // Dynamic Filters
  if (email) {
    params.push(`%${email}%`);
    query += ` AND u.email ILIKE $${params.length}`;
  }
  if (firstName) {
    params.push(`%${firstName}%`);
    query += ` AND u.firstname ILIKE $${params.length}`;
  }
  if (lastName) {
    params.push(`%${lastName}%`);
    query += ` AND u.lastname ILIKE $${params.length}`;
  }
  if (status) {
    params.push(status); // Matches ENUM 'not-blocked', 'warned', 'blocked'
    query += ` AND c.blockedstatus = $${params.length}`;
  }
  if (postcode) {
    params.push(`%${postcode}%`);
    query += ` AND c.postcode ILIKE $${params.length}`;
  }
  if (deliveryZone) {
    params.push(deliveryZone); // Matches 'A', 'B', or 'C'
    query += ` AND c.deliveryzone ILIKE $${params.length}`;
  }

  // Pagination
  query += ` ORDER BY u.email ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  try {
    const results = await pool.query(query, params);
    const totalEntries = results.rows.length > 0 ? parseInt(results.rows[0].totalentries) : 0;

    res.status(200).json({
      metadata: {
        totalEntries,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
      data: results.rows.map(row => {
        const { totalentries, ...data } = row;
        return data;
      })
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.patch('/customers/:email/blocked-status', async (req, res) => {
  const customerEmail = req.params.email;
  const updatedBlockedStatus = req.body.blockedStatus;

  try {
    const query = {
      text: `UPDATE Customer 
             SET blockedStatus = $1 
             WHERE email = $2
             RETURNING email, blockedStatus as status`,
      values: [updatedBlockedStatus, customerEmail]
    };

    const results = await pool.query(query);

    if (results.rows.length <= 0) {
      return res.status(409).json({
        error: `Could not update status. Either the user "${customerEmail}" doesn't exist, or the transition from the current state to "${updatedBlockedStatus}" is not permitted.`
      });
    }

    res.status(200).json(results.rows[0]);

  } catch (error) {
    console.error(`Error while updating blocked status for: "${customerEmail}"`, error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const restaurantRoutes = require('./admin/restaurants.js')
router.use('/restaurants', restaurantRoutes);

const logRoutes = require('./admin/logs.js');
router.use('/logs', logRoutes);

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

const voucherRoutes = require('./admin/vouchers.js');
router.use('/vouchers', voucherRoutes);

const deliveryZoneRoutes = require('./admin/deliveryZones.js')
router.use('/delivery-zones', deliveryZoneRoutes);

const profileRoutes = require('./admin/profile.js');
router.use('/profile', profileRoutes);

module.exports = router;