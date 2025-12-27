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

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Missing email or password.' });
  }

  try {
    const query = `SELECT email, password, role FROM View_User_Roles
    WHERE email = $1`;
    const results = await pool.query(query, [email]);

    // handle no match
    const invalidMessage = 'Invalid email or password.';
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
      email: user.email,
      role: user.role
    }

    const token = jwt.sign(
      payload, cfg.auth.jwt_key, { expiresIn: cfg.auth.expiration }
    );

    res.status(200).json({
      "message": "login successful",
      email: user.email,
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

  const { email, password, firstName, lastName, address, postcode, phoneNumber } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Missing email or password.' });
  }

  const client = await pool.connect();

  try {
    const hashedPassword = await bcrypt.hash(password, numSaltRounds);

    await client.query('BEGIN');

    const userQuery = `
    INSERT INTO AppUser(email, password, firstname, lastname)
    VALUES
      ($1, $2, $3, $4)
    RETURNING email
  `;
    const userQueryParams = [email, hashedPassword, firstName, lastName];
    const userResults = await client.query(userQuery, userQueryParams);

    const customerQuery = `
    INSERT INTO Customer (email, blockedStatus, address, postcode, phoneNumber)
      VALUES ($1, 'not-blocked', $2, $3, $4);
  `;
    const customerQueryParams = [email, address, postcode, phoneNumber];
    await client.query(customerQuery, customerQueryParams);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'User registration succesful',
      email: userResults.rows[0].email
    })
  } catch (err) {
    await client.query('ROLLBACK');

    if (err.code === '23505') { // unique violation (email already exists)
      return res.status(409).json({ message: 'email already taken.' });
    }

    console.error('Database error on registration: ', err);
    res.status(500).json({ message: 'Internal server error' });

  } finally {
    client.release();
  }
});



router.post('/reset-password', authenticate, async (req, res) => {
  const email = req.user.email; // email comes from authenticate middleware
  const { password: newPassword  } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: 'New password is required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, numSaltRounds);

    const query = 'UPDATE AppUser SET password = $1 WHERE email = $2 RETURNING email';
    const params = [hashedPassword, email];

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ message: email });
  } catch (err) {
    res.status(500).json({ message: 'Server error during password reset.' });
  }

});

module.exports = router;
