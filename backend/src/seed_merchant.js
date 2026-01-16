const db = require('./config/db');
const { v4: uuidv4 } = require('uuid');

(async () => {
  try {
    const apiKey = 'test_key_abc123';
    // Ensure merchants table exists and insert if missing
    const res = await db.query('SELECT id FROM merchants WHERE api_key = $1', [apiKey]);
    if (res.rows.length > 0) {
      console.log('Merchant already exists:', res.rows[0].id);
      process.exit(0);
    }

    const id = uuidv4();
    await db.query('INSERT INTO merchants (id, name, api_key) VALUES ($1, $2, $3)', [id, 'Test Merchant', apiKey]);
    console.log('Inserted test merchant with id:', id);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.stack || err.message || err);
    process.exit(1);
  }
})();
