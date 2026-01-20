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
      "SELECT * FROM restaurant WHERE owneremail = $1",
      [ownerUsername],
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
  const ownerUsername = req.user.email;
  const { street, number, postcode, region, phoneNum } = req.body;

  try {
    const existing = await pool.query(
      "SELECT 1 FROM restaurant WHERE owneremail = $1",
      [ownerUsername],
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Restaurant already exists" });
    }

    await pool.query(
      `
      INSERT INTO restaurant
      (owneremail, approvalstatus, address, postcode, phonenumber, name)
      VALUES ($1, 'pending', $2, $3, $4, 'My Restaurant')
      `,
      [ownerUsername, street, postcode, phoneNum],
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
  const ownerUsername = req.user.email;
  const { name, description } = req.body;

  try {
    const restaurant = await pool.query(
      "SELECT id FROM restaurant WHERE owneremail = $1 AND approvalstatus = 'approved'",
      [ownerUsername],
    );

    if (restaurant.rows.length === 0) {
      return res.status(400).json({ message: "Create restaurant first" });
    }

    await pool.query(
      "INSERT INTO menu (restaurantid, name, description) VALUES ($1, $2, $3)",
      [restaurant.rows[0].id, name, description],
    );

    res.json({ message: "Menu created" });
  } catch (err) {
    console.error("CREATE MENU ERROR:", err);
    res.status(500).json({ message: "Failed to create menu" });
  }
});

// =====================================================
// GET my menus
// =====================================================
router.get("/menus", async (req, res) => {
  const ownerUsername = req.user.email;

  try {
    const result = await pool.query(
      `
      SELECT m.*
      FROM menu m
      JOIN restaurant r ON r.id = m.restaurantid
      WHERE r.owneremail = $1 
      AND approvalstatus = 'approved'
      `,
      [ownerUsername],
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
      `
      INSERT INTO dish (menuid, name, description, price, photolink)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [menuID, name, description, price, photoLink],
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
    const result = await pool.query("SELECT * FROM dish WHERE menuid = $1", [
      menuID,
    ]);

    res.json({ dishes: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load dishes" });
  }
});

// =====================================================
// UPDATE order status
// =====================================================
router.put("/orders/:orderID/status", async (req, res) => {
  const ownerEmail = req.user.email;
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
      JOIN restaurant r ON r.id = o.restaurantid
      WHERE o.orderid = $1
        AND r.owneremail = $2
      `,
      [orderID, ownerEmail],
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
      [status, orderID],
    );

    logOrderStatusChange(orderID, status, ownerEmail);

    res.json({
      message: "Order status updated",
      order: updated.rows[0],
    });
  } catch (err) {
    console.error("UPDATE ORDER STATUS ERROR:", err);
    res.status(500).json({ message: "Failed to update order status" });
  }
});

async function logOrderStatusChange(orderId, status, changedBy) {
  const query = `
    INSERT INTO OrderHistory (orderId, status, changedBy)
    VALUES ($1, $2, $3)`;
  await pool.query(query, [orderId, status, changedBy]);
}

// =====================================================
// UPDATE restaurant profile
// =====================================================
router.put("/restaurant/settings", async (req, res) => {
  const owner = req.user.email;
  const { restaurantID, name, phone } = req.body;

  try {
    const r = await pool.query(
      `
      SELECT id
      FROM restaurant
      WHERE owneremail = $1
      ${restaurantID ? "AND id = $2" : ""}
      LIMIT 1
      `,
      restaurantID ? [owner, restaurantID] : [owner],
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
        phonenumber = COALESCE($2, phonenumber)
      WHERE id = $3
      RETURNING *
      `,
      [name, phone, id],
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
  const ownerUsername = req.user.email;

  try {
    const result = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM "Order" o
      JOIN restaurant r ON r.id = o.restaurantid
      WHERE r.owneremail = $1
      AND approvalstatus = 'approved'
      `,
      [ownerUsername],
    );

    res.json({
      today: Number(result.rows[0].total),
      thisWeek: Number(result.rows[0].total),
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
  const ownerUsername = req.user.email;

  try {
    const result = await pool.query(
      `
      SELECT d.name, COUNT(*) AS count
      FROM orderitem oi
      JOIN dish d ON d.dishid = oi.dishid
      JOIN "Order" o ON o.orderid = oi.orderid
      JOIN restaurant r ON r.id = o.restaurantid
      WHERE r.owneremail = $1
      AND approvalstatus = 'approved'
      GROUP BY d.name
      ORDER BY count DESC
      LIMIT 5
      `,
      [ownerUsername],
    );

    res.json({ topDishes: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load dish analytics" });
  }
});

// =====================================================
// GET orders for my restaurant
// =====================================================
router.get("/orders", async (req, res) => {
  const ownerUsername = req.user.email;

  try {
    const orders = await pool.query(
      `
      SELECT
        o.orderid,
        o.status,
        o.customeremail,
        o.deliveryaddress
      FROM "Order" o
      JOIN restaurant r ON r.id = o.restaurantid
      WHERE r.owneremail = $1
      AND approvalstatus = 'approved'
      ORDER BY o.orderid DESC
      `,
      [ownerUsername],
    );

    res.json({ orders: orders.rows });
  } catch (err) {
    console.error("GET /owner/orders ERROR:", err);
    res.status(500).json({ message: "Failed to load orders" });
  }
});

// =====================================================
// UPDATE dish
// =====================================================
router.put("/dishes/:dishID", async (req, res) => {
  const { dishID } = req.params;
  const { name, description, price, photoLink } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE dish
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        photolink = COALESCE($4, photolink)
      WHERE dishid = $5
      RETURNING *
      `,
      [name, description, price, photoLink, dishID],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Dish not found" });
    }

    res.json({ message: "Dish updated", dish: result.rows[0] });
  } catch (err) {
    console.error("UPDATE DISH ERROR:", err);
    res.status(500).json({ message: "Failed to update dish" });
  }
});

// =====================================================
// DELETE dish
// =====================================================
router.delete("/dishes/:dishID", async (req, res) => {
  const { dishID } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM dish WHERE dishid = $1 RETURNING dishid",
      [dishID],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Dish not found" });
    }

    res.json({ message: "Dish deleted", dishID: result.rows[0].dishid });
  } catch (err) {
    console.error("DELETE DISH ERROR:", err);
    res.status(500).json({ message: "Failed to delete dish" });
  }
});

module.exports = router;
