// Seed 7 completed payments for submission/demo
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1';
process.env.DB_USER = process.env.DB_USER || 'gateway_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'gateway_pass';
process.env.DB_NAME = process.env.DB_NAME || 'payment_gateway';

const db = require('./config/db');
const { v4: uuidv4 } = require('uuid');

(async () => {
  try {
    // Ensure test merchant exists (same as seed_merchant)
    const apiKey = 'test_key_abc123';
    let m = (await db.query('SELECT id FROM merchants WHERE api_key = $1', [apiKey])).rows[0];
    let merchantId;
    if (!m) {
      merchantId = uuidv4();
      await db.query('INSERT INTO merchants (id, name, api_key) VALUES ($1, $2, $3)', [merchantId, 'Test Merchant', apiKey]);
      console.log('Created test merchant', merchantId);
    } else {
      merchantId = m.id;
      console.log('Using existing merchant', merchantId);
    }

    // Insert 7 completed payments
    for (let i = 1; i <= 7; i++) {
      const paymentId = 'pay_' + uuidv4().replace(/-/g, '').substring(0, 15);
      const orderId = `order_demo_${Date.now()}_${i}`;
      const amount = 1000 + i * 100;
      const method = i % 2 === 0 ? 'card' : 'upi';
      await db.query(
        'INSERT INTO payments (id, order_id, merchant_id, amount, status, method, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())',
        [paymentId, orderId, merchantId, amount, 'success', method]
      );
      console.log('Inserted payment', paymentId);
    }

    const cnt = (await db.query('SELECT COUNT(1) as c FROM payments WHERE merchant_id = $1', [merchantId])).rows[0].c;
    console.log(`Done. Payments for merchant ${merchantId}:`, cnt);
    process.exit(0);
  } catch (err) {
    console.error('Seed payments error:', err.stack || err.message || err);
    process.exit(1);
  }
})();
