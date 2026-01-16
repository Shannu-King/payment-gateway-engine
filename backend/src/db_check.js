const db = require('./config/db');

(async () => {
  try {
    const res = await db.query('SELECT id FROM merchants WHERE api_key = $1', ['test_key_abc123']);
    console.log('Rows:', res.rows.length);
    console.log(res.rows);
    process.exit(0);
  } catch (err) {
    console.error('DB query error:', err.stack || err.message || err);
    process.exit(1);
  }
})();
