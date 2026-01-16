const { Worker } = require('bullmq');
const { connection, webhookQueue } = require('../config/queue');
const db = require('../config/db');

const worker = new Worker('payment-queue', async (job) => {
    const { paymentId } = job.data;
    
    // 1. Fetch payment details
    const res = await db.query('SELECT * FROM payments WHERE id = $1', [paymentId]);
    const payment = res.rows[0];

    // 2. Simulate processing delay (Requirement: 5-10s or Test Mode)
    const delay = process.env.TEST_MODE === 'true' 
        ? parseInt(process.env.TEST_PROCESSING_DELAY || 1000) 
        : Math.floor(Math.random() * (10000 - 5000 + 1) + 5000);
    await new Promise(r => setTimeout(r, delay));

    // 3. Determine Outcome (Requirement: UPI 90%, Card 95% success)
    let success = false;
    if (process.env.TEST_MODE === 'true') {
        success = process.env.TEST_PAYMENT_SUCCESS !== 'false';
    } else {
        const chance = Math.random() * 100;
        success = payment.method === 'upi' ? chance <= 90 : chance <= 95;
    }

    // 4. Update Database
    const status = success ? 'success' : 'failed';
    await db.query('UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2', [status, paymentId]);

    // 5. Enqueue Webhook
    await webhookQueue.add('send-webhook', {
        event: `payment.${status}`,
        paymentId: paymentId,
        merchantId: payment.merchant_id
    });
}, { connection });