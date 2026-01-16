// Insert N pending payments and enqueue them for processing
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const db = require('./config/db');
const { paymentQueue } = require('./config/queue');
const { v4: uuidv4 } = require('uuid');

(async () => {
  try {
    const merchantRes = await db.query("SELECT id FROM merchants WHERE api_key = $1", ['test_key_abc123']);
    if (merchantRes.rows.length === 0) {
      console.error('Test merchant not found. Run seed first.');
      process.exit(1);
    }
    const merchantId = merchantRes.rows[0].id;

    const toCreate = 5;
    for (let i = 0; i < toCreate; i++) {
      const paymentId = 'pay_' + uuidv4().replace(/-/g, '').substring(0, 15);
      const orderId = `order_enq_${Date.now()}_${i}`;
      const amount = 1000 + i * 50;
      const method = i % 2 === 0 ? 'card' : 'upi';
      await db.query('INSERT INTO payments (id, order_id, merchant_id, amount, status, method, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())', [paymentId, orderId, merchantId, amount, 'pending', method]);
      await paymentQueue.add('process-payment', { paymentId });
      console.log('Inserted + enqueued', paymentId);
    }

    console.log('Done inserting and enqueueing', toCreate, 'payments');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
