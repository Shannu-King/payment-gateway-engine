const db = require('./config/db');
const { v4: uuidv4 } = require('uuid');

(async () => {
  try {
    // Ensure table exists (simple schema safe for tests)
    await db.query(`CREATE TABLE IF NOT EXISTS merchants (
      id UUID PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      api_key VARCHAR(255) UNIQUE NOT NULL,
      webhook_url TEXT,
      webhook_secret VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    const res = await db.query('SELECT id, name, api_key FROM merchants LIMIT 1');
    if (res.rows.length > 0) {
      console.log('Found merchant:', res.rows[0]);
      process.exit(0);
    }

    // Insert a test merchant with a known API key
    const id = uuidv4();
    const apiKey = 'test_key_abc123';
    await db.query(
      'INSERT INTO merchants (id, name, api_key, webhook_secret) VALUES ($1, $2, $3, $4)',
      [id, 'Test Merchant', apiKey, 'webhook_secret_123']
    );

    console.log('Inserted test merchant with api_key:', apiKey);
    process.exit(0);
  } catch (err) {
    console.error('Error checking/inserting merchant:', err.message || err);
    process.exit(1);
  }
})();
