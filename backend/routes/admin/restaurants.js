const express = require('express');
const router = express.Router();
const pool = require('../../pool.js');

// prefix '/admin/restaurants'

router.get('/', async (req, res) => {
  const { id, name, owner, status, address, phoneNum, postcode, cuisine, deliveryZone, limit = 50, offset = 0 } = req.query;

  // Start with a base query
  let query = `SELECT 
    id,
    name,
    owneremail,
    address,
    postcode,
    phonenumber,
    cuisine,
    deliveryzone, 
    approvalStatus,
    servicefee as "serviceFee",
    servicefeetype as "serviceFeeType",
    COUNT(*) OVER() as totalEntries FROM restaurant WHERE 1=1`;
  const params = [];

  // Dynamically add filters
  if (id) {
    params.push(`%${id}%`);
    query += ` AND id = $${params.length}`;
  }

  if (name) {
    params.push(`%${name}%`);
    query += ` AND name ILIKE $${params.length}`;
  }


  if (owner) {
    params.push(`%${owner}%`);
    query += ` AND owneremail ILIKE $${params.length}`;
  }

  if (status) {
    params.push(status);
    query += ` AND approvalstatus = $${params.length}`;
  }

  if (address) {
    params.push(`%${address}%`);
    query += ` AND address ILIKE $${params.length}`;
  }

  if (phoneNum) {
    params.push(`%${phoneNum}%`);
    query += ` AND phonenumber ILIKE $${params.length}`;
  }

  if (postcode) {
    params.push(`%${postcode}%`);
    query += ` AND postcode ILIKE $${params.length}`;
  }

  if (cuisine) {
    params.push(`%${cuisine}%`);
    query += ` AND cuisine ILIKE $${params.length}`;
  }

  if (deliveryZone) {
    params.push(`%${deliveryZone}%`);
    query += ` AND deliveryzone IlIKE $${params.length}`;
  }

  // Pagination and Ordering
  query += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  try {
    const results = await pool.query(query, params);

    const totalEntries = results.rows.length > 0 ? parseInt(results.rows[0].totalentries) : 0;

    res.json({
      metadata: {
        totalEntries: totalEntries,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
      data: results.rows.map(row => {
        const { totalEntries, ...data } = row;
        return data;
      })
    });

  } catch (err) {
    res.status(500).send("Server Error");
  }
});

router.patch('/:id/approval-status', async (req, res) => {
  const restaurantId = req.params.id;
  const updatedApprovalStatus = req.body.approvalStatus;

  let permitedFromApprovalStatus = [];
  switch (updatedApprovalStatus) {
    case 'approved':
      permitedFromApprovalStatus.push('suspended');
    case 'rejected':
      permitedFromApprovalStatus.push('pending');
      break;
    case 'suspended':
      permitedFromApprovalStatus.push('approved');
      break;
    default:
  }

  try {
    const query = {
      text: `UPDATE restaurant SET approvalstatus = $1
            WHERE "id" = $2 AND approvalstatus = ANY($3)
            RETURNING "id", approvalstatus`,
      values: [updatedApprovalStatus, restaurantId, permitedFromApprovalStatus]
    };

    const results = await pool.query(query);

    if (results.rows.length <= 0) {
      return res.status(409).json({ error: `No restaurants with id "${restaurantId}" and valid approval status.` });
    }

    res.status(200).json(results.rows[0]);
  } catch (error) {
    console.error(`Error while updating approval status of restaurant with id: "${restaurantId}"`, error.message);
    res.status(500).json({ error: `Error while updating approval status of restaurant with id: "${restaurantId}"` + error.message });
  }
})

router.put('/:id/service-fee', async (req, res) => {
  const restaurantId = req.params.id;
  let { updateServiceFee, updateServiceFeeType } = req.body;
  updateServiceFee = (updateServiceFee === '') ? 0 : updateServiceFee;

  if (updateServiceFee < 0) {
    return res.status(400).json({ error: "Service fee must be greater or equal to 0." });
  }

  if (updateServiceFee > 2147483647) {
    return res.status(400).json({ error: "Don't be ridiculous: service fee too large." });
  }

  if (!Number.isInteger(Number(updateServiceFee))) {
    return res.status(400).json({ error: "Service fee must be a whole number of cents or percent." });
  }

  const query = {
    text: `UPDATE restaurant SET
          servicefee = $1,
          servicefeetype = $2
          WHERE id = $3
          RETURNING id, servicefee as "serviceFee", servicefeetype as "serviceFeeType"`,
    values: [updateServiceFee, updateServiceFeeType, restaurantId]
  };

  try {
    const results = await pool.query(query);

    if (results.rows.length <= 0) {
      return res.status(409).json({ error: `No restaurants with id "${restaurantId}".` });
    }

    res.status(200).json(results.rows[0]);
  } catch (error) {
    console.error(`Error while updating approval status of restaurant with id: "${restaurantId}"`, error.message);
    res.status(500).json({ error: `"${restaurantId}"` + error.message });
  }
});

module.exports = router;