const db = require('./config/db');

(async () => {
  try {
    const res = await db.query('SELECT id, order_id, amount, status, created_at FROM payments ORDER BY created_at DESC LIMIT 5');
    console.log('Recent payments:');
    console.table(res.rows);
    process.exit(0);
  } catch (err) {
    console.error('DB error:', err.stack || err.message || err);
    process.exit(1);
  }
})();
