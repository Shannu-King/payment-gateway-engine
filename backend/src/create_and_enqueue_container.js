// Create payments directly in the container Postgres and enqueue them
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const db = require('./config/db');
const { paymentQueue } = require('./config/queue');
const { v4: uuidv4 } = require('uuid');

(async () => {
  try {
    const merchantRes = await db.query("SELECT id FROM merchants WHERE api_key = $1", ['test_key_abc123']);
    let merchantId;
    if (merchantRes.rows.length === 0) {
      merchantId = uuidv4();
      await db.query('INSERT INTO merchants (id, name, api_key) VALUES ($1,$2,$3)', [merchantId, 'Test Merchant', 'test_key_abc123']);
      console.log('Created merchant', merchantId);
    } else {
      merchantId = merchantRes.rows[0].id;
      console.log('Using merchant', merchantId);
    }

    const count = parseInt(process.env.CREATE_COUNT || '5');
    for (let i = 0; i < count; i++) {
      const paymentId = 'pay_' + uuidv4().replace(/-/g, '').substring(0, 15);
      const orderId = `container_order_${Date.now()}_${i}`;
      const amount = 1000 + i * 100;
      const method = i % 2 === 0 ? 'card' : 'upi';
      await db.query('INSERT INTO payments (id, order_id, merchant_id, amount, status, method, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())', [paymentId, orderId, merchantId, amount, 'pending', method]);
      await paymentQueue.add('process-payment', { paymentId });
      console.log('Inserted & enqueued', paymentId);
    }

    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
