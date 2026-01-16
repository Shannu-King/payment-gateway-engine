const db = require('./config/db');

(async () => {
  try {
    const res = await db.query('SELECT id, name, api_key, created_at FROM merchants');
    console.log('merchants count:', res.rows.length);
    res.rows.forEach(r => console.log(r));
    process.exit(0);
  } catch (err) {
    console.error('Error querying merchants:', err.message || err);
    process.exit(1);
  }
})();
