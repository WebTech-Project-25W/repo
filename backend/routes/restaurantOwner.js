const express = require("express");
const router = express.Router();
const pool = require("../pool");
const authenticate = require("../middleware/authenticate");

router.use(authenticate);

// =====================================================
// GET my restaurant
// =====================================================
router.get("/restaurant", async (req, res) => {
  const ownerUsername = req.user.email;

  try {
    const result = await pool.query(
      "SELECT * FROM Restaurant WHERE owneremail = $1",
      [ownerUsername]
    );

    res.json({ restaurant: result.rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load restaurant" });
    res.status(500).json({ message: "Failed to load restaurant" });
  }
});

// =====================================================
// CREATE my restaurant (only once)
// =====================================================
router.post("/restaurant", async (req, res) => {
  const ownerUsername = req.user.email;
  const { street, number, postcode, region, phoneNum } = req.body;

  try {
    const existing = await pool.query(
      "SELECT 1 FROM Restaurant WHERE owneremail = $1",
      [ownerUsername]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Restaurant already exists" });
      return res.status(400).json({ message: "Restaurant already exists" });
    }

    await pool.query(
      `INSERT INTO Restaurant
       (owneremail, approvalStatus, street, streetNumber, postcode, region, phoneNum)
       VALUES ($1, 'pending', $2, $3, $4, $5, $6)`,
      [ownerUsername, street, number, postcode, region, phoneNum]
    );

    res.json({ message: "Restaurant created" });
    res.json({ message: "Restaurant created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create restaurant" });
    res.status(500).json({ message: "Failed to create restaurant" });
  }
});

// =====================================================
// CREATE menu
// =====================================================
router.post("/menus", async (req, res) => {
  const ownerUsername = req.user.email;
  const { name, description } = req.body;

  try {
    const restaurant = await pool.query(
      "SELECT restaurantid FROM Restaurant WHERE owneremail = $1",
      "SELECT restaurantid FROM Restaurant WHERE owneremail = $1",
      [ownerUsername]
    );

    if (restaurant.rows.length === 0) {
      return res.status(400).json({ message: "Create restaurant first" });
      return res.status(400).json({ message: "Create restaurant first" });
    }

    await pool.query(
      "INSERT INTO Menu (restaurantid, name, description) VALUES ($1, $2, $3)",
      "INSERT INTO Menu (restaurantid, name, description) VALUES ($1, $2, $3)",
      [restaurant.rows[0].restaurantid, name, description]
    );

    res.json({ message: "Menu created" });
    res.json({ message: "Menu created" });
  } catch (err) {
    console.error("CREATE MENU ERROR:", err);
    res.status(500).json({ message: "Failed to create menu" });
    console.error("CREATE MENU ERROR:", err);
    res.status(500).json({ message: "Failed to create menu" });
  }
});

// =====================================================
// GET my menus  ✅ FIXED
// GET my menus  ✅ FIXED
// =====================================================
router.get("/menus", async (req, res) => {
  const ownerUsername = req.user.email;

  try {
    const result = await pool.query(
      `
      SELECT m.*
      FROM Menu m
      JOIN Restaurant r ON r.restaurantid = m.restaurantid
      WHERE r.owneremail = $1
      `,
      `
      SELECT m.*
      FROM Menu m
      JOIN Restaurant r ON r.restaurantid = m.restaurantid
      WHERE r.owneremail = $1
      `,
      [ownerUsername]
    );

    res.json({ menus: result.rows });
  } catch (err) {
    console.error("GET MENUS ERROR:", err);
    res.status(500).json({ message: "Failed to load menus" });
    console.error("GET MENUS ERROR:", err);
    res.status(500).json({ message: "Failed to load menus" });
  }
});

// =====================================================
// CREATE dish
// =====================================================
router.post("/dishes", async (req, res) => {
router.post("/dishes", async (req, res) => {
  const { menuID, name, description, price, photoLink } = req.body;

  try {
    await pool.query(
      `INSERT INTO Dish (menuID, name, description, price, photoLink)
       VALUES ($1,$2,$3,$4,$5)`,
      [menuID, name, description, price, photoLink]
    );

    res.json({ message: "Dish created" });
    res.json({ message: "Dish created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create dish" });
    res.status(500).json({ message: "Failed to create dish" });
  }
});

// =====================================================
// GET dishes by menu
// =====================================================
router.get("/dishes/:menuID", async (req, res) => {
router.get("/dishes/:menuID", async (req, res) => {
  const { menuID } = req.params;

  try {
    const result = await pool.query("SELECT * FROM Dish WHERE menuID = $1", [
      menuID,
    ]);
    const result = await pool.query("SELECT * FROM Dish WHERE menuID = $1", [
      menuID,
    ]);

    res.json({ dishes: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load dishes" });
    res.status(500).json({ message: "Failed to load dishes" });
  }
});

// =====================================================
// UPDATE order status (robust: handles schema differences)
// =====================================================
router.put("/orders/:orderID/status", async (req, res) => {
  const ownerUsername = req.user.email;
  const { orderID } = req.params;
  const { status } = req.body;

  const allowedTransitions = {
    pending: ["accepted", "rejected"],
    accepted: ["preparing"],
    preparing: ["ready"],
    ready: ["dispatched"],
  };

  try {
    const current = await pool.query(
      `
      SELECT o.status
      FROM "Order" o
      JOIN Restaurant r ON r.id = o.restaurantid
      WHERE o.orderid = $1
        AND r.owneremail = $2
      `,
      [orderID, ownerUsername]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    if (current.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const currentStatus = current.rows[0].status;

    if (!allowedTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({
        message: `Invalid transition from ${currentStatus} to ${status}`,
      });
    }

    const updated = await pool.query(
      `
      UPDATE "Order"
      SET status = $1
      WHERE orderid = $2
      RETURNING orderid, status
      `,
      [status, orderID]
    );

    const currentStatus = current.rows[0].status;

    if (!allowedTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({
        message: `Invalid transition from ${currentStatus} to ${status}`,
      });
    }

    const updated = await pool.query(
      `
      UPDATE "Order"
      SET status = $1
      WHERE orderid = $2
      RETURNING orderid, status
      `,
      [status, orderID]
    );

    res.json({
      message: "Order status updated",
      order: updated.rows[0],
      message: "Order status updated",
      order: updated.rows[0],
    });
  } catch (err) {
    console.error("UPDATE ORDER STATUS ERROR:", err);
    res.status(500).json({ message: "Failed to update order status" });
    console.error("UPDATE ORDER STATUS ERROR:", err);
    res.status(500).json({ message: "Failed to update order status" });
  }
});

// =====================================================
// UPDATE restaurant profile (name/phone/openingHours/deliveryZone)
// =====================================================
router.put("/restaurant/settings", async (req, res) => {
  const owner = req.user.email;
  const { restaurantID, name, phone, openingHours, deliveryZone } = req.body;

  try {
    const r = await pool.query(
      `
      SELECT id
      FROM restaurant
      WHERE (ownerusername = $1 OR owneremail = $1)
      ${restaurantID ? "AND id = $2" : ""}
      LIMIT 1
      `,
      restaurantID ? [owner, restaurantID] : [owner]
    );

    if (r.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Restaurant not found for this owner" });
    if (r.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Restaurant not found for this owner" });
    }

    const id = r.rows[0].id;

    const updated = await pool.query(
      `
      UPDATE restaurant
      SET
        name = COALESCE($1, name),
        phonenumber = COALESCE($2, phonenumber),
        openinghours = COALESCE($3, openinghours),
        deliveryzone = COALESCE($4, deliveryzone)
      WHERE id = $5
      RETURNING id, name, phonenumber, openinghours, deliveryzone
      `,
      [name, phone, openingHours, deliveryZone, id]
    );

    const id = r.rows[0].id;

    const updated = await pool.query(
      `
      UPDATE restaurant
      SET
        name = COALESCE($1, name),
        phonenumber = COALESCE($2, phonenumber),
        openinghours = COALESCE($3, openinghours),
        deliveryzone = COALESCE($4, deliveryzone)
      WHERE id = $5
      RETURNING id, name, phonenumber, openinghours, deliveryzone
      `,
      [name, phone, openingHours, deliveryZone, id]
    );

    res.json({
      message: "Restaurant settings saved",
      restaurant: updated.rows[0],
      message: "Restaurant settings saved",
      restaurant: updated.rows[0],
    });
  } catch (err) {
    console.error("SAVE SETTINGS ERROR:", err);
    res.status(500).json({ message: "Failed to save restaurant settings" });
    console.error("SAVE SETTINGS ERROR:", err);
    res.status(500).json({ message: "Failed to save restaurant settings" });
  }
});

// =====================================================
// ANALYTICS: daily & weekly order counts
// =====================================================
router.get("/analytics/orders", async (req, res) => {
  const ownerUsername = req.user.email;

  try {
    const result = await pool.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE o.createdAt::date = CURRENT_DATE) AS today,
        COUNT(*) FILTER (WHERE o.createdAt >= CURRENT_DATE - INTERVAL '7 days') AS thisWeek
      FROM OrderTable o
      JOIN Restaurant r ON r.restaurantID = o.restaurantID
      WHERE r.owneremail = $1
      `,
      [ownerUsername]
    );

    res.json({
      today: Number(result.rows[0].today),
      thisWeek: Number(result.rows[0].thisweek),
      thisWeek: Number(result.rows[0].thisweek),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load order analytics" });
    res.status(500).json({ message: "Failed to load order analytics" });
  }
});

// =====================================================
// ANALYTICS: most ordered dishes
// =====================================================
router.get("/analytics/top-dishes", async (req, res) => {
  const ownerUsername = req.user.email;

  try {
    const result = await pool.query(
      `
      SELECT d.name, COUNT(*) AS count
      FROM OrderItem oi
      JOIN Dish d ON d.dishID = oi.dishID
      JOIN OrderTable o ON o.orderID = oi.orderID
      JOIN Restaurant r ON r.restaurantID = o.restaurantID
      WHERE r.owneremail = $1
      GROUP BY d.name
      ORDER BY count DESC
      LIMIT 5
      `,
      [ownerUsername]
    );

    res.json({ topDishes: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load dish analytics" });
  }
});

// =====================================================
// GET orders for my restaurant  ✅ REQUIRED
// =====================================================
router.get("/orders", async (req, res) => {
  const ownerUsername = req.user.email;

  try {
    const orders = await pool.query(
      `
      SELECT o.orderid,
             o.status,
             o.createdat
      FROM "Order" o
      JOIN Restaurant r ON r.id = o.restaurantid
      WHERE r.owneremail = $1
      ORDER BY o.orderid DESC
      `,
      [ownerUsername]
    );

    res.json({ orders: orders.rows });
  } catch (err) {
    console.error("GET /owner/orders ERROR:", err);
    res.status(500).json({ message: "Failed to load orders" });
  }
});

module.exports = router;
