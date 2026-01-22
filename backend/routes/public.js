const express = require("express");
const router = express.Router();
const pool = require("../pool");

// =====================================================
// GET all approved restaurants (PUBLIC)
// =====================================================
router.get("/restaurants", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        r.name,
        r.address,
        r.postcode,
        r.phonenumber,
        r.openinghours,
        r.deliveryzone,
        r.cuisine,

        COALESCE(ROUND(AVG(rt.rating)::numeric, 1), 0) AS "averageRating",
        COUNT(rt.rating) AS "ratingCount"

      FROM restaurant r
      LEFT JOIN ratings rt
        ON rt.restaurantId = r.id

      WHERE r.approvalstatus = 'approved'

      GROUP BY r.id
      ORDER BY r.name
    `);

    res.json({ restaurants: result.rows });
  } catch (err) {
    console.error("PUBLIC RESTAURANTS ERROR:", err);
    res.status(500).json({ message: "Failed to load restaurants" });
  }
});


// =====================================================
// GET menus + dishes of a restaurant (PUBLIC)
// =====================================================
router.get("/restaurants/:restaurantID/menus", async (req, res) => {
  const { restaurantID } = req.params;

  try {
    const menus = await pool.query(
      `
      SELECT m.*
      FROM menu m
      JOIN restaurant r ON r.id = m.restaurantid
      WHERE m.restaurantid = $1
      AND r.approvalstatus = 'approved'
      `,
      [restaurantID],
    );

    for (let menu of menus.rows) {
      const dishes = await pool.query(`SELECT * FROM dish WHERE menuid = $1`, [
        menu.menuid,
      ]);
      menu.dishes = dishes.rows;
    }

    res.json({ menus: menus.rows });
  } catch (err) {
    console.error("PUBLIC MENUS ERROR:", err);
    res.status(500).json({ message: "Failed to load menus" });
  }
});

// =====================================================
// GET single restaurant profile (PUBLIC)
// =====================================================
router.get("/restaurants/:restaurantID", async (req, res) => {
  const { restaurantID } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
  id,
  name,
  address,
  postcode,
  phonenumber,
  openinghours,
  deliveryzone
FROM restaurant
WHERE id = $1
AND approvalstatus = 'approved'

      `,
      [restaurantID],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.json({ restaurant: result.rows[0] });
  } catch (err) {
    console.error("PUBLIC RESTAURANT ERROR:", err);
    res.status(500).json({ message: "Failed to load restaurant" });
  }
});

// GET average rating for a restaurant
router.get('/restaurants/:id/ratings', async (req, res) => {

  const restaurantId = req.params.id;

  try {
    const result = await pool.query(
      `
      SELECT
        ROUND(AVG(rating)::numeric, 1) AS average,
        COUNT(*) AS count
      FROM ratings
      WHERE restaurantid = $1
      `,
      [restaurantId]
    );

    res.json({
      average: result.rows[0].average || 0,
      count: Number(result.rows[0].count)
    });
  } catch (err) {
    console.error('Failed to fetch restaurant ratings', err);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// GET average rating for a dish
router.get("/dishes/:dishId/ratings", async (req, res) => {
  const { dishId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        COALESCE(AVG(rating), 0) AS average,
        COUNT(*) AS count
      FROM ratings
      WHERE dishId = $1
      `,
      [dishId]
    );

    res.json({
      average: Number(result.rows[0].average),
      count: Number(result.rows[0].count),
    });
  } catch (err) {
    console.error("Get dish ratings error:", err);
    res.status(500).json({ error: "Failed to load dish ratings" });
  }
});

// GET textual reviews for a restaurant
router.get('/reviews/:restaurantId', async (req, res) => {
  const { restaurantId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        reviewid,
        customeremail,
        rating,
        description,
        timestamp
      FROM review
      WHERE restaurantid = $1
      ORDER BY timestamp DESC
      `,
      [restaurantId]
    );

    res.json({
      reviews: result.rows,
    });
  } catch (err) {
    console.error('Failed to load reviews', err);
    res.status(500).json({ error: 'Failed to load reviews' });
  }
});

//..
module.exports = router;
