const { Pool } = require("pg");
const cfg = require("./config.json");

const pool = new Pool({
  user: cfg.database.user,
  host: cfg.database.host,
  database: cfg.database.db,
  password: cfg.database.password,
  port: cfg.database.port || 5432,
});

pool
  .connect()
  .then((client) => {
    console.log("✅ Connected to PostgreSQL");
    client.release();
  })
  .catch((err) => {
    console.error("❌ PostgreSQL connection error:", err.message);
  });

module.exports = pool;
