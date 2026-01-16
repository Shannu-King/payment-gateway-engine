const { Worker } = require('bullmq');
const { connection, webhookQueue } = require('../config/queue');
const db = require('../config/db');

const worker = new Worker('refund-queue', async (job) => {
    const { refundId } = job.data;

    // Simulate 3-5 second delay
    const delay = Math.floor(Math.random() * (5000 - 3000 + 1) + 3000);
    await new Promise(res => setTimeout(res, delay));

    // Update status to 'processed'
    await db.query(
        'UPDATE refunds SET status = \'processed\', processed_at = NOW() WHERE id = $1',
        [refundId]
    );

    // Fetch refund data for webhook
    const refundRes = await db.query('SELECT * FROM refunds WHERE id = $1', [refundId]);
    const refund = refundRes.rows[0];

    // Enqueue webhook for 'refund.processed'
    await webhookQueue.add('send-webhook', {
        event: 'refund.processed',
        refundId: refundId,
        merchantId: refund.merchant_id
    });

}, { connection });