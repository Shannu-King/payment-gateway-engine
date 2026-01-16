// Export recent payments (last 2 hours) from the host DB into SQL inserts
const fs = require('fs');
const db = require('./src/config/db');

(async () => {
  try {
    const res = await db.query("SELECT * FROM payments WHERE created_at >= NOW() - INTERVAL '2 hours'");
    if (res.rows.length === 0) {
      console.log('No recent payments found to export.');
      process.exit(0);
    }

    const lines = [];
    lines.push('BEGIN;');
    for (const p of res.rows) {
      const payload = [
        p.id,
        p.order_id || '',
        p.merchant_id || 'NULL',
        p.amount || 0,
        p.status || 'pending',
        p.method || 'card',
        p.created_at ? `TIMESTAMP '${p.created_at.toISOString().replace('T',' ').replace('Z','')}'` : 'NOW()',
        p.updated_at ? `TIMESTAMP '${p.updated_at.toISOString().replace('T',' ').replace('Z','')}'` : 'NOW()'
      ];

      const merchantVal = p.merchant_id ? `'${p.merchant_id}'` : 'NULL';
      const sql = `INSERT INTO payments (id, order_id, merchant_id, amount, status, method, created_at, updated_at) VALUES ('${p.id}','${p.order_id}','${p.merchant_id}',${p.amount},'${p.status}','${p.method}',${p.created_at ? `TIMESTAMP '${p.created_at.toISOString().replace('T',' ').replace('Z','')}'` : 'NOW()'},${p.updated_at ? `TIMESTAMP '${p.updated_at.toISOString().replace('T',' ').replace('Z','')}'` : 'NOW()'}) ON CONFLICT (id) DO NOTHING;`;
      lines.push(sql);
    }
    lines.push('COMMIT;');

    fs.writeFileSync('backend/recent_payments_export.sql', lines.join('\n'));
    console.log('Wrote backend/recent_payments_export.sql with', res.rows.length, 'payments');
    process.exit(0);
  } catch (err) {
    console.error('Export error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
