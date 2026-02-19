const { Pool } = require("pg");
const cfg = require("./config.json");

const pool = new Pool({
  user: cfg.database.user,
  host: cfg.database.host,
  database: cfg.database.db,
  password: cfg.database.password,
  port: cfg.database.port || 5432,
});

module.exports = pool; 
