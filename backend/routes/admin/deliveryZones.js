const express = require('express');
const router = express.Router();
const pool = require('../../pool.js');

// prefix '/admin/delivery-zones'

router.get('/', async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;

  try {
    const query = {
      text: `SELECT id, isactive as "isActive", COUNT(*) OVER() as totalEntries
        FROM deliveryZone
        WHERE 1=1`,
      values: []
    };

    // dynamic filters
    const { id, isActive } = req.query;

    if (id) {
      query.values.push(id);
      query.text += ` AND id = $${query.values.length}`;
    }

    if (isActive) {
      query.values.push(isActive);
      query.text += ` AND isActive = $${query.values.length}`;
    }

    query.text += ` ORDER BY deliveryZone ASC LIMIT $${query.values.length + 1} OFFSET $${query.values.length + 2}`;
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
    console.error("Error while fetching delivery zones:", error.message);
    res.status(500).json({ error: "Error while fetching delivery zones." });
  }
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const updatedIsActive = req.body.isActive;

  try {
    const query = {
      text: `UPDATE deliveryZone SET
        isactive = $1
        WHERE id = $2
        RETURNING id, isactive as "isActive"`,
      values: [updatedIsActive, id]
    };

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Delivery zone not found" });
    }

    res.status(200).json({
      message: "Delivery zone updated successfully",
      deliveryZone: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "Internal Server Error" });
  }
});

router.post('/', async (req, res) => {
  const { id, isActive } = req.body;

  // 1. Basic Validation
  if (!id) {
    return res.status(400).json({ message: 'Delivery Zone is required.' });
  }

  const regex = /[A-Za-z0-9]/;
  if (id.length != 1 || !id.match(regex)) {
    return res.status(400).json({ message: 'Invalid delivery zone id. Id must be a single letter or number.' });
  }

  try {
    const query = {
      text: `INSERT INTO deliveryzone (id, isactive) 
             VALUES ($1, $2) 
             RETURNING id, isactive AS "isActive"`,
      values: [id, isActive ?? true]
    };

    const result = await pool.query(query);
    const newDeliveryZone = result.rows[0];

    res.status(201).json({
      message: 'Delivery zone created successfully',
      deliveryZone: newDeliveryZone
    });

  } catch (err) {
    console.error('Error inserting delivery zone:', err);

    // Handle Unique Constraint Violation (e.g., duplicate delivery zone)
    if (err.code === '23505') {
      return res.status(409).json({ message: 'delivery zone already exists.' });
    }

    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  // 1. Validation: Ensure the ID is a valid delivery zone
  if (!id || id.length != 1) {
    return res.status(400).json({ message: 'A valid delivery zone ID is required.' });
  }

  try {
    // 2. SQL Query
    const query = {
      text: 'DELETE FROM deliveryZone WHERE id = $1 RETURNING id',
      values: [id]
    };

    const result = await pool.query(query);

    // 3. Check if any row was found and deleted
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'delivery zone not found.' });
    }

    // 4. Send success response
    res.status(200).json({
      message: 'deliveryZone deleted successfully',
      deletedId: id
    });

  } catch (err) {
    console.error('Error deleting delivery zone:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;