const pool = require("./pool");

const bcrypt = require("bcrypt");
const fs = require("fs");

const saltRounds = 10;

async function resetDatabase() {
  const client = await pool.connect();
  try {
    console.log("--- Starting Database Reset ---");

    // Load external files
    const path = require("path");

    const sql = fs.readFileSync(
      path.join(__dirname, "create_tables.sql"),
      "utf8",
    );

    const seedData = require("./seedData.json");

    await client.query("BEGIN");

    // Drop and Create Tables
    console.log("Applying create_tables.sql...");
    await client.query(sql);

    // Helper Function to Hash and Insert Users
    const seedUser = async (
      user,
      roleTable,
      extraCols = "",
      extraVals = [],
    ) => {
      const hash = await bcrypt.hash(user.password, saltRounds);
      await client.query(
        "INSERT INTO AppUser (email, password, firstname, lastname) VALUES ($1, $2, $3, $4)",
        [user.email, hash, user.firstname, user.lastname],
      );
      const roleSql = `INSERT INTO ${roleTable} (email ${extraCols}) VALUES ($1 ${extraVals
        .map((_, i) => ", $" + (i + 2))
        .join("")})`;
      await client.query(roleSql, [user.email, ...extraVals]);
    };

    // Clean Ratings
    await client.query('TRUNCATE TABLE ratings RESTART IDENTITY CASCADE');


    // Seed Users
    console.log("Seeding Users...");
    for (const user of seedData.siteManagers)
      await seedUser(user, "SiteManager");
    for (const user of seedData.restaurantOwners)
      await seedUser(user, "RestaurantOwner");
    for (const user of seedData.customers) {
      await seedUser(
        user,
        "Customer",
        ", blockedStatus, address, postcode, phoneNumber, deliveryZone",
        [user.status, user.address, user.postcode, user.phone, user.deliveryZone],
      );
    }

    // Seed logInHistory
    console.log("Seeding LoginHistory...");
    for (const log of seedData.loginHistory) {
      const result = await client.query(
        `INSERT INTO LogInHistory (userEmail, time, ipAddress, status, userAgent)
        VALUES ($1, $2, $3, $4, $5)`,
        [log.userEmail, log.time, log.ipAddress, log.status, log.userAgent],
      );
    }

    // Seed Restaurants & Track IDs
    console.log("Seeding Restaurants...");
    const restoIDs = [];
    for (const restaurant of seedData.restaurants) {
      const result = await client.query(
        `INSERT INTO Restaurant 
   (name, ownerEmail, approvalStatus, address, postcode, phoneNumber, cuisine, openingHours, deliveryZone) 
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
   RETURNING id`,
        [
          restaurant.name,
          restaurant.owner,
          restaurant.status,
          restaurant.addr,
          restaurant.postcode,
          restaurant.phone,
          restaurant.cuisine || null,
          restaurant.openingHours || null,
          restaurant.deliveryZone || null,
        ],
      );

      restoIDs.push(result.rows[0].id);
    }

    // Seed Reviews
    for (const review of seedData.reviews) {
      await client.query(
        "INSERT INTO Review (restaurantID, customerEmail, timeStamp, rating, description) VALUES ($1, $2, $3, $4, $5)",
        [
          restoIDs[review.restoID],
          review.user,
          review.time,
          review.rating,
          review.desc,
        ],
      );
    }

    // Seed Menus & Track IDs
    const menuIDs = [];
    for (const menu of seedData.menus) {
      const result = await client.query(
        "INSERT INTO Menu (restaurantID, name, description) VALUES ($1, $2, $3) RETURNING menuID",
        [restoIDs[menu.restoID], menu.name, menu.desc],
      );
      menuIDs.push(result.rows[0].menuid);
    }

    // Seed Dishes & Track IDs
    const dishIDs = [];
    for (const dish of seedData.dishes) {
      const result = await client.query(
        "INSERT INTO Dish (menuID, name, description, price, photoLink) VALUES ($1, $2, $3, $4, $5) RETURNING dishID",
        [menuIDs[dish.menuID], dish.name, dish.desc, dish.price, dish.link],
      );
      dishIDs.push(result.rows[0].dishid);
    }

    // Seed Orders and Order Items
    console.log("Seeding Orders...");
    for (const order of seedData.orders) {
      const result = await client.query(
        'INSERT INTO "Order" (customerEmail, restaurantID, status, deliveryAddress) VALUES ($1, $2, $3, $4) RETURNING orderID',
        [
          order.customerEmail,
          restoIDs[order.restoID],
          order.status,
          order.addr,
        ],
      );
      const orderId = result.rows[0].orderid;
      for (const item of order.items) {
        await client.query(
          "INSERT INTO OrderItem (orderID, dishID, quantity, unitPrice) VALUES ($1, $2, $3, $4)",
          [orderId, dishIDs[item.dishID], item.qty, item.price],
        );
      }
    }

    // Seed OrderHistory
    console.log("Seeing OrderHistory...");
    for (const orderlog of seedData.orderHistory) {
      const result = await client.query(
        `INSERT INTO OrderHistory (orderID, time, status, changedBy)VALUES ($1, $2, $3, $4)`,
        [orderlog.orderId, orderlog.time, orderlog.status, orderlog.changedBy]
      );
    }

 // Seed Ratings
console.log("Seeding Ratings...");

for (const rating of seedData.ratings) {
  if (rating.restaurantID !== undefined) {
    await client.query(
      `
      INSERT INTO ratings (customerEmail, restaurantId, rating)
      VALUES ($1, $2, $3)
      `,
      [
        rating.customerEmail,
        restoIDs[rating.restaurantID],
        rating.rating
      ]
    );
  }

  if (rating.dishID !== undefined) {
    await client.query(
      `
      INSERT INTO ratings (customerEmail, dishId, rating)
      VALUES ($1, $2, $3)
      `,
      [
        rating.customerEmail,
        dishIDs[rating.dishID],
        rating.rating
      ]
    );
  }
}

    await client.query("COMMIT");
    console.log("--- Database Reset & Seeded Successfully ---");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("!!! Error resetting database !!!");
    console.error(err);
  } finally {
    client.release();
    process.exit();
  }
}

resetDatabase();
