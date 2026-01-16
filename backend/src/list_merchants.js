const db = require('./config/db');

(async () => {
  try {
    const res = await db.query('SELECT id, name, api_key, created_at FROM merchants ORDER BY created_at DESC LIMIT 20');
    console.log('Merchants:', res.rows);
    process.exit(0);
  } catch (err) {
    console.error('Error listing merchants:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
