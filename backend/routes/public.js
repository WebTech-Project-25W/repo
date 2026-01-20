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
        id,
        name,
        address,
        postcode,
        phonenumber,
        cuisine
      FROM restaurant
      WHERE approvalstatus = 'approved'
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
      `SELECT * FROM menu WHERE restaurantid = $1`,
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
        phonenumber
      FROM restaurant
      WHERE id = $1
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
//..
module.exports = router;
