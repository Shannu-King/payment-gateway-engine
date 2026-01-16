// Simple script to load DB config and exit
// Force DB port to the temporary container mapping for local testing
process.env.DB_PORT = process.env.DB_PORT || '5433';
const db = require('./config/db');

// If pool has a query method, run a quick check
if (db && typeof db.query === 'function') {
  db.query('SELECT 1 as ok', (err, res) => {
    if (err) {
      console.error('Test query failed:', err.message || err);
      process.exit(1);
    }
    console.log('Test query succeeded:', res.rows[0]);
    process.exit(0);
  });
} else {
  console.error('DB export does not expose query()');
  process.exit(1);
}
