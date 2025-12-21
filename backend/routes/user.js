const express = require('express');
const router = express.Router();
const pool = require('../pool');

router.get('/', (req, res) => {
  res.json({ message: "test user route"});
});


module.exports = router;