const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'gateway_user',
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME || 'payment_gateway',
  password: String(process.env.DB_PASSWORD || 'gateway_pass'),
  port: parseInt(process.env.DB_PORT || '5433'),
});

pool.on('connect', () => {
  console.log('✅ Database Connected Successfully');
});

// Log unexpected errors from the pool (helps diagnose auth/network issues)
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err.message || err);
});

module.exports = pool;

// Debug: log DB connection parameters (excluding password)
console.log('DB config:', {
  user: process.env.DB_USER || 'gateway_user',
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME || 'payment_gateway',
  port: parseInt(process.env.DB_PORT || '5433')
});