// Re-enqueue payments that are marked as 'failed'
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const db = require('./config/db');
const { paymentQueue } = require('./config/queue');

(async () => {
  try {
    const res = await db.query("SELECT id FROM payments WHERE status = 'failed' ORDER BY updated_at ASC LIMIT 100");
    if (res.rows.length === 0) {
      console.log('No failed payments found to re-enqueue.');
      process.exit(0);
    }

    for (const { id } of res.rows) {
      await paymentQueue.add('process-payment', { paymentId: id });
      console.log('Re-enqueued failed payment', id);
    }

    console.log('Re-enqueued', res.rows.length, 'failed payments.');
    process.exit(0);
  } catch (err) {
    console.error('Error re-enqueueing failed payments:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
