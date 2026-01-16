const { Queue } = require('bullmq');
const db = require('./config/db');
const { connection } = require('./config/queue');

async function main() {
  try {
    const p = await db.query("SELECT id, merchant_id FROM payments WHERE status='success' AND merchant_id IS NOT NULL ORDER BY created_at DESC LIMIT 1");
    if (!p.rows.length) {
      console.log('No successful payment with merchant_id found.');
      process.exit(0);
    }
    const payment = p.rows[0];

    const m = await db.query('SELECT id, webhook_url FROM merchants WHERE id = $1', [payment.merchant_id]);
    const merchant = m.rows[0];
    if (!merchant) {
      console.log('Merchant not found for payment', payment.id);
      process.exit(1);
    }

    const queue = new Queue('webhook-queue', { connection });
    await queue.add('send-webhook', { event: 'payment.succeeded', paymentId: payment.id, merchantId: merchant.id });
    console.log('Enqueued webhook job for payment', payment.id);
    await queue.close();
    process.exit(0);
  } catch (err) {
    console.error('Error enqueuing webhook', err);
    process.exit(2);
  }
}

main();
