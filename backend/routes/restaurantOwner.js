const express = require("express");
const router = express.Router();
const pool = require("../pool");
const authenticate = require("../middleware/authenticate");

router.use(authenticate);

// =====================================================
// GET my restaurant
// =====================================================
router.get("/restaurant", async (req, res) => {
  const ownerUsername = req.user.username;

  try {
    const result = await pool.query(
      "SELECT * FROM Restaurant WHERE ownerUsername = $1",
      [ownerUsername]
    );

    res.json({ restaurant: result.rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load restaurant" });
  }
});

// =====================================================
// CREATE my restaurant (only once)
// =====================================================
router.post("/restaurant", async (req, res) => {
  const ownerUsername = req.user.username;
  const { street, number, postcode, region, phoneNum } = req.body;

  try {
    const existing = await pool.query(
      "SELECT 1 FROM Restaurant WHERE ownerUsername = $1",
      [ownerUsername]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Restaurant already exists" });
    }

    await pool.query(
      `INSERT INTO Restaurant
       (ownerUsername, approvalStatus, street, streetNumber, postcode, region, phoneNum)
       VALUES ($1, 'pending', $2, $3, $4, $5, $6)`,
      [ownerUsername, street, number, postcode, region, phoneNum]
    );

    res.json({ message: "Restaurant created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create restaurant" });
  }
});

// =====================================================
// CREATE menu
// =====================================================
router.post("/menus", async (req, res) => {
  const ownerUsername = req.user.username;
  const { name, description } = req.body;

  try {
    const restaurant = await pool.query(
      "SELECT restaurantid FROM Restaurant WHERE owneremail = $1",
      [ownerUsername]
    );

    if (restaurant.rows.length === 0) {
      return res.status(400).json({ message: "Create restaurant first" });
    }

    await pool.query(
      "INSERT INTO Menu (restaurantid, name, description) VALUES ($1, $2, $3)",
      [restaurant.rows[0].restaurantid, name, description]
    );

    res.json({ message: "Menu created" });
  } catch (err) {
    console.error("CREATE MENU ERROR:", err);
    res.status(500).json({ message: "Failed to create menu" });
  }
});

// =====================================================
// GET my menus  ✅ FIXED
// =====================================================
router.get("/menus", async (req, res) => {
  const ownerUsername = req.user.username;

  try {
    const result = await pool.query(
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
  }
});

// =====================================================
// CREATE dish
// =====================================================
router.post("/dishes", async (req, res) => {
  const { menuID, name, description, price, photoLink } = req.body;

  try {
    await pool.query(
      `INSERT INTO Dish (menuID, name, description, price, photoLink)
       VALUES ($1,$2,$3,$4,$5)`,
      [menuID, name, description, price, photoLink]
    );

    res.json({ message: "Dish created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create dish" });
  }
});

// =====================================================
// GET dishes by menu
// =====================================================
router.get("/dishes/:menuID", async (req, res) => {
  const { menuID } = req.params;

  try {
    const result = await pool.query("SELECT * FROM Dish WHERE menuID = $1", [
      menuID,
    ]);

    res.json({ dishes: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load dishes" });
  }
});

// =====================================================
// GET orders for my restaurant
// =====================================================
// =====================================================
// GET orders for my restaurant
// =====================================================
// =====================================================
// GET orders for my restaurant (robust: works with ownerUsername/owneremail + createdAt/createdat)
// =====================================================
// =====================================================
// UPDATE order status (robust: handles schema differences)
// =====================================================
router.put("/orders/:orderID/status", async (req, res) => {
  const ownerUsername = req.user.username;
  const { orderID } = req.params;
  const { status } = req.body;

  const allowedTransitions = {
    pending: ["accepted", "rejected"],
    accepted: ["preparing"],
    preparing: ["ready"],
    ready: ["dispatched"],
  };

  try {
    // get order + ownership
    const current = await pool.query(
      `
      SELECT o.status
      FROM "Order" o
      JOIN Restaurant r ON r.id = o.restaurantid
      WHERE o.orderid = $1
        AND r.ownerusername = $2
      `,
      [orderID, ownerUsername]
    );

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

    res.json({
      message: "Order status updated",
      order: updated.rows[0],
    });
  } catch (err) {
    console.error("UPDATE ORDER STATUS ERROR:", err);
    res.status(500).json({ message: "Failed to update order status" });
  }
});

// =====================================================
// UPDATE order status (accept → preparing → ready → dispatched / reject)
// =====================================================

// =====================================================
// UPDATE restaurant opening hours & delivery zone
// =====================================================
// =====================================================
// UPDATE restaurant profile (name/phone/openingHours/deliveryZone)
// =====================================================
router.put("/restaurant/settings", async (req, res) => {
  const owner = req.user.username;
  const { restaurantID, name, phone, openingHours, deliveryZone } = req.body;

  try {
    // Find restaurant that belongs to this owner (by username OR email)
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

    res.json({
      message: "Restaurant settings saved",
      restaurant: updated.rows[0],
    });
  } catch (err) {
    console.error("SAVE SETTINGS ERROR:", err);
    res.status(500).json({ message: "Failed to save restaurant settings" });
  }
});

// =====================================================
// ANALYTICS: daily & weekly order counts
// =====================================================
router.get("/analytics/orders", async (req, res) => {
  const ownerUsername = req.user.username;

  try {
    const result = await pool.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE o.createdAt::date = CURRENT_DATE) AS today,
        COUNT(*) FILTER (WHERE o.createdAt >= CURRENT_DATE - INTERVAL '7 days') AS thisWeek
      FROM OrderTable o
      JOIN Restaurant r ON r.restaurantID = o.restaurantID
      WHERE r.ownerUsername = $1
      `,
      [ownerUsername]
    );

    res.json({
      today: Number(result.rows[0].today),
      thisWeek: Number(result.rows[0].thisweek),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load order analytics" });
  }
});

// =====================================================
// ANALYTICS: most ordered dishes
// =====================================================
router.get("/analytics/top-dishes", async (req, res) => {
  const ownerUsername = req.user.username;

  try {
    const result = await pool.query(
      `
      SELECT d.name, COUNT(*) AS count
      FROM OrderItem oi
      JOIN Dish d ON d.dishID = oi.dishID
      JOIN OrderTable o ON o.orderID = oi.orderID
      JOIN Restaurant r ON r.restaurantID = o.restaurantID
      WHERE r.ownerUsername = $1
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
// DELETE dish
// =====================================================
router.delete("/dishes/:dishID", async (req, res) => {
  const { dishID } = req.params;

  try {
    await pool.query("DELETE FROM Dish WHERE dishID = $1", [dishID]);

    res.json({ message: "Dish deleted" });
  } catch (err) {
    console.error("DELETE DISH ERROR:", err);
    res.status(500).json({ message: "Failed to delete dish" });
  }
});

// =====================================================
// UPDATE dish  ✅ REQUIRED FOR EDIT
// =====================================================
// =====================================================
// UPDATE dish  ✅ FIXED
// =====================================================
router.put("/dishes/:dishID", async (req, res) => {
  const { dishID } = req.params;
  const { name, description, price, photolink } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE Dish
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        photolink = COALESCE($4, photolink)
      WHERE dishid = $5
      RETURNING *
      `,
      [name, description, price, photolink, dishID]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Dish not found" });
    }

    res.json({
      message: "Dish updated",
      dish: result.rows[0],
    });
  } catch (err) {
    console.error("UPDATE DISH ERROR:", err);
    res.status(500).json({ message: "Failed to update dish" });
  }
});

// =====================================================
// DELETE menu (and its dishes)
// =====================================================
router.delete("/menus/:menuID", async (req, res) => {
  const { menuID } = req.params;

  try {
    // delete dishes first (FK safety)
    await pool.query("DELETE FROM Dish WHERE menuID = $1", [menuID]);

    await pool.query("DELETE FROM Menu WHERE menuID = $1", [menuID]);

    res.json({ message: "Menu deleted" });
  } catch (err) {
    console.error("DELETE MENU ERROR:", err);
    res.status(500).json({ message: "Failed to delete menu" });
  }
});
// =====================================================
// CREATE TEST ORDER (FOR DEMO PURPOSES)
// =====================================================
router.post("/orders/test", async (req, res) => {
  const ownerUsername = req.user.username;

  try {
    const restaurant = await pool.query(
      "SELECT restaurantID FROM Restaurant WHERE owneremail = $1",
      [ownerUsername]
    );

    if (restaurant.rows.length === 0) {
      return res.status(400).json({ message: "Restaurant not found" });
    }

    const result = await pool.query(
      `INSERT INTO OrderTable (restaurantID, status, createdAt)
       VALUES ($1, 'pending', NOW())
       RETURNING orderID, status, createdAt`,
      [restaurant.rows[0].restaurantid]
    );

    res.json({
      message: "Test order created",
      order: result.rows[0],
    });
  } catch (err) {
    console.error("CREATE TEST ORDER ERROR:", err);
    res.status(500).json({ message: "Failed to create test order" });
  }
});
// =====================================================
// GET orders for my restaurant  ✅ REQUIRED
// =====================================================
router.get("/orders", async (req, res) => {
  const ownerUsername = req.user.username;

  try {
    const orders = await pool.query(
      `
      SELECT o.orderid,
             o.status,
             o.createdat
      FROM "Order" o
      JOIN Restaurant r ON r.id = o.restaurantid
      WHERE r.ownerusername = $1
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
