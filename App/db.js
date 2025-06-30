require('dotenv').config();
const mysql = require('mysql2/promise');


const pool = mysql.createPool({
  host: process.env.AIVEN_HOST,
  port: process.env.AIVEN_PORT,
  user: process.env.AIVEN_USER,
  password: process.env.AIVEN_PASSWORD,
  database: process.env.AIVEN_DB,
  waitForConnections: true,
  connectionLimit: 10,
  ssl: { rejectUnauthorized: false }   // ← skips CA validation
});

module.exports = pool;
