let cfg = require('../config.json')
const express = require('express');
const router = express.Router();

const pool = require('../pool.js');

const jwt = require('jsonwebtoken');

// login route creating/returning a token on successful login
router.post('/login', (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({message:'Missing username or password.'});
    }

    const query = `SELECT username, password FROM public.appuser
    WHERE username = $1 and password = $2`;

    // issue query (returns promise)
    pool.query(query, [username, password])
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
                login: resultUser.login,
                token: token
            });

        })
        .catch(error => {
            // handle error accessing db
            console.error('Database query error:'+error);
            res.status(500).json({ message: "Database access error"});
        });

});

module.exports = router;
