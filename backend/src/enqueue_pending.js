// Enqueue all pending payments into the paymentQueue for workers to process
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const db = require('./config/db');
const { paymentQueue } = require('./config/queue');

(async () => {
  try {
    const res = await db.query("SELECT id FROM payments WHERE status = 'pending' ORDER BY created_at ASC");
    if (res.rows.length === 0) {
      console.log('No pending payments to enqueue.');
      process.exit(0);
    }

    for (const row of res.rows) {
      await paymentQueue.add('process-payment', { paymentId: row.id });
      console.log('Enqueued payment', row.id);
    }

    console.log('Enqueued', res.rows.length, 'payments.');
    process.exit(0);
  } catch (err) {
    console.error('Enqueue error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
