const { Worker, Queue } = require('bullmq');
const axios = require('axios');
const crypto = require('crypto');
const { connection } = require('../config/queue');
const db = require('../config/db');

// Allow re-enqueueing from the worker and avoid referencing an undefined queue
const webhookQueue = new Queue('webhook-queue', { connection });

const worker = new Worker('webhook-queue', async (job) => {
    const { event, paymentId, merchantId, attempt = 1 } = job.data;
    
    const merchant = (await db.query('SELECT * FROM merchants WHERE id = $1', [merchantId])).rows[0];
    if (!merchant?.webhook_url) return;

    const payment = (await db.query('SELECT * FROM payments WHERE id = $1', [paymentId])).rows[0];
    const payload = { event, timestamp: Math.floor(Date.now()/1000), data: { payment } };
    
    // Generate HMAC Signature
    const signature = crypto.createHmac('sha256', merchant.webhook_secret)
                            .update(JSON.stringify(payload))
                            .digest('hex');

    try {
        await axios.post(merchant.webhook_url, payload, {
            headers: { 'X-Webhook-Signature': signature },
            timeout: 5000
        });
        try {
            await db.query(
                'INSERT INTO webhook_logs (merchant_id, event, payload, status, attempts, last_attempt_at) VALUES ($1, $2, $3, $4, $5, NOW())',
                [merchantId, event, JSON.stringify(payload), 'success', attempt]
            );
        } catch (dbErr) {
            console.warn('Webhook log insert failed', dbErr?.message || dbErr);
        }
    } catch (err) {
        if (attempt < 5) {
            // Exponential Backoff Logic
            const delays = [0, 60, 300, 1800, 7200]; 
            try {
                await webhookQueue.add('send-webhook', { ...job.data, attempt: attempt + 1 }, { delay: delays[attempt] * 1000 });
            } catch (qErr) {
                console.warn('Failed to re-enqueue webhook job', qErr?.message || qErr);
            }
        } else {
            // Final failure - record it
            try {
                await db.query(
                    'INSERT INTO webhook_logs (merchant_id, event, payload, status, attempts, response_code, last_attempt_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
                    [merchantId, event, JSON.stringify(payload), 'failed', attempt, err?.response?.status || null]
                );
            } catch (dbErr) {
                console.warn('Webhook failure log insert failed', dbErr?.message || dbErr);
            }
        }
    }
}, { connection });