// db.js
require('dotenv').config();
const mysql = require('mysql2/promise');

module.exports = function (dbUrl = process.env.DATABASE_URL) {
  if (dbUrl) {
    // mysql2 can parse a full URI, including ?ssl-mode=REQUIRED
    return mysql.createPool(dbUrl);
  }

  // Fallback to individual vars (keeps old behaviour)
  return mysql.createPool({
    host: process.env.AIVEN_HOST,
    port: process.env.AIVEN_PORT,
    user: process.env.AIVEN_USER,
    password: process.env.AIVEN_PASSWORD,
    database: process.env.AIVEN_DB,
    waitForConnections: true,
    connectionLimit: 10,
    ssl: { rejectUnauthorized: false },
  });
};
