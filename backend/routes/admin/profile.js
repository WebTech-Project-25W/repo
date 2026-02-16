const express = require('express');
const router = express.Router();
const pool = require('../../pool.js');

// prefixed by /profile' in admin.js

router.get('/', async (req, res) => {
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

router.put('/', async (req, res) => {
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