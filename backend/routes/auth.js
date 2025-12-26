const cfg = require('../config.json')
const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();

const pool = require('../pool.js');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authenticate.js');

const numSaltRounds = 10;

// login route creating/returning a token on successful login
router.post('/login', async (req, res) => {

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Missing username or password.' });
  }

  try {
    const query = `SELECT username, password, role FROM View_User_Roles
    WHERE username = $1`;
    const results = await pool.query(query, [username]);

    // handle no match
    const invalidMessage = 'Invalid username or password.';
    if (results.rows.length === 0) {
      return res.status(401).json({ message: invalidMessage });
    }

    // user found
    const user = results.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: invalidMessage });
    }

    // password match: form the token with userData
    const payload = {
      username: user.username,
      role: user.role
    }

    const token = jwt.sign(
      payload, cfg.auth.jwt_key, { expiresIn: cfg.auth.expiration }
    );

    res.status(200).json({
      "message": "login successful",
      username: user.username,
      role: user.role,
      token: token
    });
  } catch (err) {
    console.error('Login error: ' + err);
    res.status(500).json({ message: "Internal server error." });
  }
});


// registration route
router.post('/register', async (req, res) => {

  const { username, password, firstName, lastName, address, postcode, phoneNumber } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Missing username or password.' });
  }

  const client = await pool.connect();

  try {
    const hashedPassword = await bcrypt.hash(password, numSaltRounds);

    await client.query('BEGIN');

    const userQuery = `
    INSERT INTO AppUser(username, password, firstname, lastname)
    VALUES
      ($1, $2, $3, $4)
    RETURNING username
  `;
    const userQueryParams = [username, hashedPassword, firstName, lastName];
    const userResults = await client.query(userQuery, userQueryParams);

    const customerQuery = `
    INSERT INTO Customer (username, blockedStatus, address, postcode, phoneNumber)
      VALUES ($1, 'not-blocked', $2, $3, $4);
  `;
    const customerQueryParams = [username, address, postcode, phoneNumber];
    await client.query(customerQuery, customerQueryParams);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'User registration succesful',
      username: userResults.rows[0].username
    })
  } catch (err) {
    await client.query('ROLLBACK');

    if (err.code === '23505') { // unique violation (username already exists)
      return res.status(409).json({ message: 'Username already taken.' });
    }

    console.error('Database error on registration: ', err);
    res.status(500).json({ message: 'Internal server error' });

  } finally {
    client.release();
  }
});



router.post('/reset-password', authenticate, async (req, res) => {
  const username = req.user.username; // username comes from authenticate middleware
  const { password: newPassword  } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: 'New password is required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, numSaltRounds);

    const query = 'UPDATE AppUser SET password = $1 WHERE username = $2 RETURNING username';
    const params = [hashedPassword, username];

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ message: username });
  } catch (err) {
    res.status(500).json({ message: 'Server error during password reset.' });
  }

});

module.exports = router;
