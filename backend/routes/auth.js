const cfg = require("../config.json");
const bcrypt = require("bcrypt");
const express = require("express");
const router = express.Router();

const pool = require("../pool.js");
const jwt = require("jsonwebtoken");
const authenticate = require("../middleware/authenticate.js");

const numSaltRounds = 10;

// login route creating/returning a token on successful login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing email or password." });
  }

  try {
    const query = `
    SELECT r.email, r.password, r.role, c.blockedStatus
    FROM View_User_Roles r LEFT JOIN customer c ON r.email = c.email
    WHERE r.email = $1`;
    const results = await pool.query(query, [email]);

    // handle no match
    const invalidMessage = "Invalid email or password.";
    if (results.rows.length === 0) {
      logLogInAttempt(email, req.ip, "Failure", req.headers["user-agent"]);
      return res.status(401).json({ message: invalidMessage });
    }

    // user found
    const user = results.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      logLogInAttempt(email, req.ip, "Failure", req.headers["user-agent"]);
      return res.status(401).json({ message: invalidMessage });
    }

    //check if user is blocked
    const blockedStatus = user.blockedstatus;
    if (blockedStatus && blockedStatus === 'blocked') {
      logLogInAttempt(email, req.ip, "Failure", req.headers["user-agent"]);
      return res.status(403).json({ error: "account_blocked" });
    }

    // password match: form the token with userData
    logLogInAttempt(email, req.ip, "Success", req.headers["user-agent"]);

    const payload = {
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, cfg.auth.jwt_key, {
      expiresIn: cfg.auth.expiration,
    });

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: false, // TODO !! change to true and use https !!
      sameSite: "lax",
      maxAge: parseToMSeconds(cfg.auth.expiration).toString(),
      path: "/",
    });

    res.status(200).json({
      message: "login successful",
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error("Login error: " + err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// registration route
router.post("/register", async (req, res) => {
  console.log(req.body);

  const {
    email,
    password,
    firstName,
    lastName,
    address,
    postcode,
    phoneNumber,
    deliveryZone
  } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing email or password." });
  }

  const client = await pool.connect();

  try {
    const hashedPassword = await bcrypt.hash(password, numSaltRounds);

    await client.query("BEGIN");

    const userQuery = `
    INSERT INTO AppUser(email, password, firstname, lastname)
    VALUES
      ($1, $2, $3, $4)
    RETURNING email
  `;
    const userQueryParams = [email, hashedPassword, firstName, lastName];
    const userResults = await client.query(userQuery, userQueryParams);

    const customerQuery = `
    INSERT INTO Customer (email, blockedStatus, address, postcode, phoneNumber, deliveryzone)
      VALUES ($1, 'not-blocked', $2, $3, $4, $5)
  `;
    const customerQueryParams = [email, address, postcode, phoneNumber, deliveryZone];
    await client.query(customerQuery, customerQueryParams);

    await client.query("COMMIT");

    res.status(201).json({
      message: "User registration succesful",
      email: userResults.rows[0].email,
    });
  } catch (err) {
    await client.query("ROLLBACK");

    if (err.code === "23505") {
      // unique violation (email already exists)
      return res.status(409).json({ message: "email already taken." });
    }

    console.error("Database error on registration: ", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
});

router.post("/reset-password", authenticate, async (req, res) => {
  const email = req.user.email;
  // email comes from authenticate middleware
  const { password: newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: "New password is required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, numSaltRounds);

    const query =
      "UPDATE AppUser SET password = $1 WHERE email = $2 RETURNING email";
    const params = [hashedPassword, email];

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: email });
  } catch (err) {
    res.status(500).json({ message: "Server error during password reset." });
  }
});

module.exports = router;

const parseToMSeconds = (timeStr) => {
  const unitMap = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000,
  };

  const match = timeStr.match(/^(\d+)([smhd])$/);

  if (!match) {
    console.error("Failed to parse time string");
    return 0; // Or handle error for invalid format
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  return value * unitMap[unit];
};

// helper function
async function logLogInAttempt(email, ip, status, deviceInfo) {
  const query = `
    INSERT INTO LogInHistory (userEmail, ipAddress, status, userAgent)
    VALUES ($1, $2, $3, $4)`;

  const safeDeviceInfo = deviceInfo ? deviceInfo.substring(0, 100) : null;

  await pool.query(query, [email, ip, status, safeDeviceInfo]);
}
