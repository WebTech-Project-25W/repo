const express = require('express');
const router = express.Router();
const pool = require('../../pool.js');

// routes prefixed by '/vouchers' in admin.jss

router.get('/', async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;

  try {
    const query = {
      // note plural table name 'vouchers' not consistent with rest of db
      text: `SELECT id, code, discount_percent as discount, is_active as "isActive", COUNT(*) OVER() as totalEntries
        FROM vouchers
        WHERE 1=1`,
      values: []
    };

    // dynamic filters
    const { id, code, discountMin, discountMax, isActive } = req.query;

    if (id) {
      query.values.push(id);
      query.text += ` AND id = $${query.values.length}`;
    }

    if (code) {
      query.values.push(`%${code}%`);
      query.text += ` AND code ILIKE $${query.values.length}`;
    }

    if (discountMin) {
      query.values.push(discountMin);
      query.text += ` AND discount_percent >= $${query.values.length}`;
    }

    if (discountMax) {
      query.values.push(discountMax);
      query.text += ` AND discount_percent <= $${query.values.length}`;
    }

    if (isActive) {
      query.values.push(isActive);
      query.text += ` AND is_active = $${query.values.length}`;
    }

    query.text += ` ORDER BY id DESC LIMIT $${query.values.length + 1} OFFSET $${query.values.length + 2}`;
    query.values.push(limit, offset);


    const results = await pool.query(query);

    const totalEntries = results.rows.length > 0 ? parseInt(results.rows[0].totalentries) : 0;

    res.status(200).json({
      metadata: {
        totalEntries,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
      data: results.rows.map(row => {
        const { totalentries, ...data } = row;
        return data;
      })
    })

  } catch (error) {
    console.error("Error while fetching vouchers:", error.message);
    res.status(500).json({ error: "Error while fetching vouchers: " + error.message });
  }
});

router.put('/:id', async (req, res) => {
  const voucherId = req.params.id;
  const updatedData = req.body;

  // check that discount is valid
  if (updatedData.discount < 0 || updatedData.discount > 100) {
    return res.status(400).json({ message: "Discount percentage invalid" });
  }

  try {
    const query = {
      text: `UPDATE vouchers SET
        code = $1,
        discount_percent = $2,
        is_active = $3
        WHERE id = $4
        RETURNING id, code, discount_percent as discount, is_active as "isActive"`,
      values: [updatedData.code, updatedData.discount, updatedData.isActive, voucherId]
    };

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    res.status(200).json({
      message: "Voucher updated successfully",
      voucher: result.rows[0]
    });
  } catch (err) {
    console.error(err);

    if (err.code === '23505') {
      return res.status(409).json({ message: 'Voucher code already exists.' });
    }

    res.status(500).json({ err: "Internal Server Error" });
  }
});

router.post('/', async (req, res) => {
  const { code, discount, isActive } = req.body;

  // 1. Basic Validation
  if (!code || discount === undefined) {
    return res.status(400).json({ message: 'Code and discount are required.' });
  }

  try {
    // 2. SQL Query
    // Note: We use "RETURNING" to send back the newly created record
    const query = {
      text: `INSERT INTO vouchers (code, discount_percent, is_active) 
             VALUES ($1, $2, $3) 
             RETURNING id, code, discount_percent AS discount, is_active AS "isActive"`,
      values: [code, discount, isActive ?? true]
    };

    const result = await pool.query(query);
    const newVoucher = result.rows[0];

    // 3. Send back success response
    res.status(201).json({
      message: 'Voucher created successfully',
      voucher: newVoucher
    });

  } catch (err) {
    console.error('Error inserting voucher:', err);

    // Handle Unique Constraint Violation (e.g., duplicate voucher code)
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Voucher code already exists.' });
    }

    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  // 1. Validation: Ensure the ID is a valid number
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ message: 'A valid Voucher ID is required.' });
  }

  try {
    // 2. SQL Query
    // We use "RETURNING *" to verify if a row was actually deleted
    const query = {
      text: 'DELETE FROM vouchers WHERE id = $1 RETURNING id',
      values: [id]
    };

    const result = await pool.query(query);

    // 3. Check if any row was found and deleted
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Voucher not found.' });
    }

    // 4. Send success response
    res.status(200).json({
      message: 'Voucher deleted successfully',
      deletedId: id
    });

  } catch (err) {
    console.error('Error deleting voucher:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;