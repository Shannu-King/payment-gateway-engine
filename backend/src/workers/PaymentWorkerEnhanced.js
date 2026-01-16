const { Worker } = require('bullmq');
const { connection, webhookQueue } = require('../config/queue');
const db = require('../config/db');

const worker = new Worker('payment-queue', async (job) => {
    const { paymentId } = job.data;
    console.log(`🔁 [Enhanced] Processing payment job ${job.id} paymentId=${paymentId}`);

    try {
        const res = await db.query('SELECT * FROM payments WHERE id = $1', [paymentId]);
        const payment = res.rows[0];
        if (!payment) throw new Error(`Payment not found: ${paymentId}`);

        const delay = process.env.TEST_MODE === 'true'
            ? parseInt(process.env.TEST_PROCESSING_DELAY || 1000)
            : Math.floor(Math.random() * (10000 - 5000 + 1) + 5000);
        await new Promise(r => setTimeout(r, delay));

        let success = false;
        if (process.env.TEST_MODE === 'true') {
            success = process.env.TEST_PAYMENT_SUCCESS !== 'false';
        } else {
            const chance = Math.random() * 100;
            success = payment.method === 'upi' ? chance <= 90 : chance <= 95;
        }

        const status = success ? 'success' : 'failed';
        await db.query('UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2', [status, paymentId]);
        console.log(`✅ [Enhanced] Payment ${paymentId} -> ${status}`);

        await webhookQueue.add('send-webhook', {
            event: `payment.${status}`,
            paymentId,
            merchantId: payment.merchant_id
        });

    } catch (err) {
        console.error(`❌ [Enhanced] Error processing payment ${paymentId}:`, err && err.stack ? err.stack : err);
        try {
            await db.query('UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2', ['failed', paymentId]);
        } catch (e) {
            console.error('[Enhanced] Failed to mark payment failed:', e && e.stack ? e.stack : e);
        }
        throw err;
    }
}, { connection });

worker.on('completed', (job) => {
    console.log(`🎉 [Enhanced] Job completed ${job.id} paymentId=${job.data.paymentId}`);
});

worker.on('failed', (job, err) => {
    console.error(`🔻 [Enhanced] Job failed ${job.id} paymentId=${job.data.paymentId}:`, err && err.message ? err.message : err);
});

module.exports = worker;
