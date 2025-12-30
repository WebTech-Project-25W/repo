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

module.exports = router;