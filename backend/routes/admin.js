const express = require('express');
const router = express.Router();
const pool = require('../pool.js');
const check_auth = require('../check_auth.js');

router.get('/users', check_auth, async (req, res) => {
    try {
        const query = {
            text: 'SELECT * FROM AppUser',
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

module.exports = router;