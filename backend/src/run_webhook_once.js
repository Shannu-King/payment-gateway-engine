const axios = require('axios');
const crypto = require('crypto');
const db = require('./config/db');

async function main() {
  try {
    const p = await db.query("SELECT id, merchant_id FROM payments WHERE status='success' AND merchant_id IS NOT NULL ORDER BY created_at DESC LIMIT 1");
    if (!p.rows.length) return console.log('No successful payment found');
    const payment = (await db.query('SELECT * FROM payments WHERE id = $1', [p.rows[0].id])).rows[0];
    const m = await db.query('SELECT * FROM merchants WHERE id = $1', [payment.merchant_id]);
    const merchant = m.rows[0];
    if (!merchant?.webhook_url) return console.log('Merchant has no webhook_url');

    const payload = { event: 'payment.succeeded', timestamp: Math.floor(Date.now()/1000), data: { payment } };
    const signature = crypto.createHmac('sha256', merchant.webhook_secret || '').update(JSON.stringify(payload)).digest('hex');

    try {
      const resp = await axios.post(merchant.webhook_url, payload, { headers: { 'X-Webhook-Signature': signature }, timeout: 5000 });
      await db.query('INSERT INTO webhook_logs (merchant_id, event, payload, status, attempts, response_code, last_attempt_at) VALUES ($1,$2,$3,$4,$5,$6,NOW())',
        [merchant.id, 'payment.succeeded', JSON.stringify(payload), 'success', 1, resp.status]);
      console.log('Webhook delivered, logged success');
    } catch (err) {
      await db.query('INSERT INTO webhook_logs (merchant_id, event, payload, status, attempts, response_code, last_attempt_at) VALUES ($1,$2,$3,$4,$5,$6,NOW())',
        [merchant.id, 'payment.succeeded', JSON.stringify(payload), 'failed', 1, err?.response?.status || null]);
      console.log('Webhook delivery failed, logged failure');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error running webhook:', err);
    process.exit(2);
  }
}

main();
