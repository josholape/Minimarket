const { Pool } = require('pg');
require('dotenv').config();

const config = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
    };

const pool = new Pool({
  ...config,
  connectionTimeoutMillis: 10000,
});

pool.on('error', err => {
  console.error('Unexpected idle database connection error:', err.message);
});

module.exports = pool;
