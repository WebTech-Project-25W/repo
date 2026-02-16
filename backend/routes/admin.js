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

router.get('/login-logs', async (req, res) => {
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

router.get('/order-logs', async (req, res) => {
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


// // // // // // // //
// Delivery Zones    // 
// // // // // // // //
router.get('/delivery-zones', async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;

  try {
    const query = {
      text: `SELECT id, isactive as "isActive", COUNT(*) OVER() as totalEntries
        FROM deliveryZone
        WHERE 1=1`,
      values: []
    };

    // dynamic filters
    const { id, isActive } = req.query;

    if (id) {
      query.values.push(id);
      query.text += ` AND id = $${query.values.length}`;
    }

    if (isActive) {
      query.values.push(isActive);
      query.text += ` AND isActive = $${query.values.length}`;
    }

    query.text += ` ORDER BY deliveryZone ASC LIMIT $${query.values.length + 1} OFFSET $${query.values.length + 2}`;
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
    console.error("Error while fetching delivery zones:", error.message);
    res.status(500).json({ error: "Error while fetching delivery zones." });
  }
});

router.put('/delivery-zones/:id', async (req, res) => {
  const id = req.params.id;
  const updatedIsActive = req.body.isActive;

  try {
    const query = {
      text: `UPDATE deliveryZone SET
        isactive = $1
        WHERE id = $2
        RETURNING id, isactive as "isActive"`,
      values: [updatedIsActive, id]
    };

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Delivery zone not found" });
    }

    res.status(200).json({
      message: "Delivery zone updated successfully",
      deliveryZone: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "Internal Server Error" });
  }
});

router.post('/delivery-zones', async (req, res) => {
  const { id, isActive } = req.body;

  // 1. Basic Validation
  if (!id) {
    return res.status(400).json({ message: 'Delivery Zone is required.' });
  }

  const regex = /[A-Za-z0-9]/;
  if (id.length != 1 || !id.match(regex)) {
    return res.status(400).json({ message: 'Invalid delivery zone id. Id must be a single letter or number.' });
  }

  try {
    const query = {
      text: `INSERT INTO deliveryzone (id, isactive) 
             VALUES ($1, $2) 
             RETURNING id, isactive AS "isActive"`,
      values: [id, isActive ?? true]
    };

    const result = await pool.query(query);
    const newDeliveryZone = result.rows[0];

    res.status(201).json({
      message: 'Delivery zone created successfully',
      deliveryZone: newDeliveryZone
    });

  } catch (err) {
    console.error('Error inserting delivery zone:', err);

    // Handle Unique Constraint Violation (e.g., duplicate delivery zone)
    if (err.code === '23505') {
      return res.status(409).json({ message: 'delivery zone already exists.' });
    }

    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE /api/deliveryZone/:id
router.delete('/delivery-zones/:id', async (req, res) => {
  const { id } = req.params;

  // 1. Validation: Ensure the ID is a valid delivery zone
  if (!id || id.length != 1) {
    return res.status(400).json({ message: 'A valid delivery zone ID is required.' });
  }

  try {
    // 2. SQL Query
    const query = {
      text: 'DELETE FROM deliveryZone WHERE id = $1 RETURNING id',
      values: [id]
    };

    const result = await pool.query(query);

    // 3. Check if any row was found and deleted
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'delivery zone not found.' });
    }

    // 4. Send success response
    res.status(200).json({
      message: 'deliveryZone deleted successfully',
      deletedId: id
    });

  } catch (err) {
    console.error('Error deleting delivery zone:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /admin/profile
router.get('/profile', async (req, res) => {
  const email = req.user.email;

  try {
    const result = await pool.query(
      `
      SELECT
        u.email,
        u.firstname,
        u.lastname
      FROM appuser u
      LEFT JOIN sitemanager a ON a.email = u.email
      WHERE u.email = $1
      `,
      [email]
    );

    res.json({
      profile: {
        firstName: result.rows[0]?.firstname || '',
        lastName: result.rows[0]?.lastname || '',
      }
    });
  } catch (err) {
    console.error('Error fetching admin profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/profile', async (req, res) => {
  const email = req.user.email;
  const { firstname, lastname } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE appuser
      SET firstname = $1,
          lastname = $2
      WHERE email = $3
      RETURNING firstname, lastname
      `,
      [firstname, lastname, email]
    );

    res.json({
      profile: {
        firstName: result.rows[0]?.firstname || '',
        lastName: result.rows[0]?.lastname || '',
      },
      message: 'Profile updated successfully'
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});
module.exports = router;