const express = require('express');
const router = express.Router();
const pool = require('../pool.js');

router.get('/test', (req, res) => {
  res.json({ message: "test user route"});
});

router.get('/', async (req, res) => {
    try {
        const query = {
            text: 'SELECT * FROM products',
            values: []
        };

        console.log("before pool call");
        const results = await pool.query(query);
        console.log("after pool call: "+results);

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