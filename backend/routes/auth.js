let cfg = require('../config.json')
const express = require('express');
const router = express.Router();

const pool = require('../pool.js');

const jwt = require('jsonwebtoken');

// login route creating/returning a token on successful login
router.post('/login', async (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({message:'Missing username or password.'});
    }

    const query = `SELECT username, role FROM View_User_Roles
    WHERE username = $1 and password = $2`;

    // issue query (returns promise)
    await pool.query(query, [username, password])
        .then (results => {

			// handle no match (login failed)
            if (results.rows.length === 0) {
                return res.status(400).json({message: "login failed"});
            }

            // everything is ok
            const resultUser = results.rows[0];
            
            /* form the token with userData (accessible when decoding token), jwtkey, expiry time */;
			const token = jwt.sign(
                resultUser, cfg.auth.jwt_key, { expiresIn: cfg.auth.expiration }
            );
            
			res.status(200).json({
                "message": "login successful",
                username: resultUser.username,
                role: resultUser.role,
                token: token
            });

        })
        .catch(error => {
            // handle error accessing db
            console.error('Database query error:'+error);
            res.status(500).json({ message: "Database access error"});
        });

});

// registration logic
router.post('/register', async (req, res) => {

  const { username, password, firstName, lastName, address, postcode, phoneNumber } = req.body;

  if (!username || !password) {
    return res.status(400).json({message:'Missing username or password.'});
  }

const client = await pool.connect();

try {
  await client.query('BEGIN');

  const userQuery = `
    INSERT INTO AppUser(username, password, firstname, lastname)
    VALUES
      ($1, $2, $3, $4)
    RETURNING username
  `;
  const userQueryParams = [username, password, firstName, lastName];
  const userResults = await pool.query(userQuery, userQueryParams);

  const customerQuery = `
    INSERT INTO Customer (username, blockedStatus, address, postcode, phoneNumber)
      VALUES ($1, 'not-blocked', $2, $3, $4);
  `;
  const customerQueryParams = [username, address, postcode, phoneNumber];
  await pool.query(customerQuery, customerQueryParams);

  await client.query('COMMIT');

  res.status(201).json({
        message: 'User registration succesful',
        username: userResults.rows[0].username
      })
} catch (err) {
  await client.query('ROLLBACK');

  if(err.code === '23505') { // unique violation (username already exists)
    return res.status(409).json({message: 'Username already taken.'});
  }

  console.error('Database error on registration: ', err);
  res.status(500).json({ message: 'Internal server error'});

} finally {
  client.release();
}
})

module.exports = router;
