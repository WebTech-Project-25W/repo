const express = require("express");
const router = express.Router();
const pool = require("../pool");
const { menuOrderMap } = require("./menuOrderStore");

// =====================================================
// GET all approved restaurants (PUBLIC)
// =====================================================
router.get("/restaurants", async (req, res) => {
  const { name, cuisine, searchHours, sortBy, sortDirection, limit = 50, offset = 0 } = req.query;

  // validation of limit
  if (limit.trim() === '' || isNaN(Number(limit)) || !Number.isInteger(Number(limit))) {
    return res.status(400).json({ error: "Limit must be an integer." });
  }

  // validation of offset
  if (offset.trim() === '' || isNaN(Number(offset)) || !Number.isInteger(Number(offset))) {
    return res.status(400).json({ error: "Offset must be an integer." });
  }

  let query = `
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
      COUNT(rt.rating) AS "ratingCount",

      COUNT(r.id) OVER() AS "totalEntries"

      FROM restaurant r
      LEFT JOIN ratings rt
        ON rt.restaurantId = r.id

      WHERE r.approvalstatus = 'approved'
  `;
  const params = [];

  // dynamic filters
  if (name && name.trim() !== '') {
    params.push(`%${name}%`);
    query += ` AND r.name ILIKE $${params.length}`
  }

  if (cuisine && cuisine.trim !== '') {
    params.push(cuisine);
    query += ` AND r.cuisine = $${params.length}`;
  }

  if (searchHours && searchHours !== '') {
    // TODO refactor db storage of opening hours to something more useable
  }

  // sorting
  // ensure input is valid column name
  const sortMapping = {
    id: 'r.id',
    name: 'r.name',
    address: 'r.address',
    postcode: 'r.postcode',
    cuisine: 'r.cuisine',
    averageRating: '"averageRating"',
    ratingCount: '"ratingCount"'
  };

  let sortByColumn = sortMapping['name'];
  if (sortBy && sortBy !== '') {
    if (sortMapping[sortBy] === undefined) {
      return res.status(400).json({ error: "Sortby column not valid." })
    }
    sortByColumn = sortMapping[sortBy];
  }

  let sortByDirection = 'ASC';
  if(sortDirection && sortDirection != '') {
    const sortDirections = ['DESC', 'ASC'];
    const sortDirectionIndex = sortDirections.indexOf(sortDirection.toUpperCase());
    if (sortDirectionIndex === -1) {
      return res.status(400).json({ error: "Sort direction not valid." })
    }
    sortByDirection = sortDirections[sortDirectionIndex];
  }


  query += `
    GROUP BY r.id
    ORDER BY ${sortByColumn} ${sortByDirection}
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  params.push(limit, offset);

  try {
    const result = await pool.query(query, params);

    const totalEntries = result.rows.length > 0 ? parseInt(result.rows[0].totalEntries) : 0;

    res.json({
      metadata: {
        totalEntries: totalEntries,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
      data: result.rows.map(row => {
        const { totalEntries, ...data } = row;
        return data;
      })
    });
  } catch (err) {
    console.error("PUBLIC RESTAURANTS ERROR:", err);
    res.status(500).json({ message: "Failed to load restaurants" });
  }
});

// =====================================================
// GET menus + dishes of a restaurant (PUBLIC)
// =====================================================
router.get("/restaurants/:restaurantID/menus", async (req, res) => {
  const restaurantID = Number(req.params.restaurantID);

  try {
    const ownerRes = await pool.query(
      "SELECT owneremail FROM restaurant WHERE id = $1 AND approvalstatus = 'approved'",
      [restaurantID],
    );

    const menus = await pool.query(
      `
      SELECT m.*
      FROM menu m
      WHERE m.restaurantid = $1
      `,
      [restaurantID],
    );

    let menuRows = menus.rows;

    if (ownerRes.rows.length > 0) {
      const ownerEmail = ownerRes.rows[0].owneremail;
      const savedOrder = menuOrderMap[ownerEmail];

      if (savedOrder) {
        const map = new Map();
        menuRows.forEach((m) => map.set(m.menuid, m));

        menuRows = savedOrder.map((id) => map.get(id)).filter(Boolean);
      }
    }

    for (let menu of menuRows) {
      const dishes = await pool.query("SELECT * FROM dish WHERE menuid = $1", [
        menu.menuid,
      ]);
      menu.dishes = dishes.rows;
    }

    res.json({ menus: menuRows });
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
router.get("/restaurants/:id/ratings", async (req, res) => {
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
      [restaurantId],
    );

    res.json({
      average: result.rows[0].average || 0,
      count: Number(result.rows[0].count),
    });
  } catch (err) {
    console.error("Failed to fetch restaurant ratings", err);
    res.status(500).json({ error: "Failed to fetch ratings" });
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
      [dishId],
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
router.get("/reviews/:restaurantId", async (req, res) => {
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
      [restaurantId],
    );

    res.json({
      reviews: result.rows,
    });
  } catch (err) {
    console.error("Failed to load reviews", err);
    res.status(500).json({ error: "Failed to load reviews" });
  }
});

//..
module.exports = router;
