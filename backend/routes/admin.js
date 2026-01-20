const express = require('express');
const router = express.Router();
const pool = require('../pool.js');

router.get('/users', async (req, res) => {
    try {
        const query = {
            text: 'SELECT * FROM AppUser ORDER BY email',
            values: []
        };

        const results = await pool.query(query);

        if (results.rows.length <= 0) {
            return res.status(404).json({ error: "Nothing found" });
        }

        res.status(200).json(results.rows);
    } catch (error) {
        console.error("Error while fetching users:", error.message);
        res.status(500).json({ error: "Error while fetching users: " + error.message });
    }
});

router.get('/restaurants', async (req, res) => {
    try {
        const query = {
            text: 'SELECT * FROM restaurant ORDER BY id',
            values: []
        };

        const results = await pool.query(query);

        if (results.rows.length <= 0) {
            return res.status(404).json({ error: "Nothing found" });
        }

        res.status(200).json(results.rows);
    } catch (error) {
        console.error("Error while fetching restaurants:", error.message);
        res.status(500).json({ error: "Error while fetching restaurants: " + error.message });
    }
});

router.patch('/restaurants/:id/approval-status', async (req, res) => {
    const restaurantId = req.params.id; 
    const updatedApprovalStatus = req.body.approvalStatus;

    let permitedFromApprovalStatus = [];
    switch(updatedApprovalStatus) {
        case 'approved':
            permitedFromApprovalStatus.push('suspended');
        case 'rejected':
            permitedFromApprovalStatus.push('pending');
            break;
        case 'suspended':
            permitedFromApprovalStatus.push('approved');
            break;
        default:
    }

    try {
        const query = {
            text: `UPDATE restaurant SET approvalstatus = $1
            WHERE "id" = $2 AND approvalstatus = ANY($3)
            RETURNING "id", approvalstatus`,
            values: [updatedApprovalStatus, restaurantId, permitedFromApprovalStatus]
        };

        const results = await pool.query(query);

        if (results.rows.length <= 0) {
            return res.status(409).json({ error: `No restaurants with id "${restaurantId}" and valid approval status.` });
        }

        res.status(200).json(results.rows[0]);
    } catch (error) {
        console.error(`Error while approving restaurant with id: "${restaurantId}"`, error.message);
        res.status(500).json({ error: `Error while approving restaurant with id: "${restaurantId}"` + error.message });
    }
})

router.get('/login-logs', async(req, res) => {
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
        data: results.rows.map( row => {
            const { totalEntries, ...data } = row;
            return data;
        })
    });

  } catch (err) {
    res.status(500).send("Server Error");
  }
});

module.exports = router;