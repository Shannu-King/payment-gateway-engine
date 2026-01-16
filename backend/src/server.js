const express = require('express');
const { paymentQueue, refundQueue, webhookQueue } = require('./config/queue');
const db = require('./config/db');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json());

// Authentication Middleware - Validates API Key
const authMiddleware = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
        return res.status(401).json({ error: 'Unauthorized', message: 'API key required in x-api-key header or Authorization bearer token' });
    }

    try {
        // Log incoming API key (masked) for debugging
        const masked = apiKey.length > 6 ? apiKey.slice(0,3) + '...' + apiKey.slice(-3) : apiKey;
        console.log(`🔐 Auth attempt - apiKey=${masked} ip=${req.ip}`);
        const merchantRes = await db.query('SELECT id FROM merchants WHERE api_key = $1', [apiKey]);
        console.log('🔎 Merchant rows:', merchantRes.rows.length);
        if (merchantRes.rows.length === 0) {
            return res.status(401).json({ error: 'Unauthorized', message: 'Invalid API key' });
        }
        
        // Attach merchant ID to request for use in route handlers
        req.merchantId = merchantRes.rows[0].id;
        next();
    } catch (err) {
        console.error('Auth Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Apply auth middleware to payment API routes
app.use('/api/v1/payments', authMiddleware);

// --- 1. POST /api/v1/payments ---
app.post('/api/v1/payments', async (req, res) => {
    const { order_id, amount, method } = req.body;
    const idempotencyKey = req.headers['idempotency-key'];

    try {
        // A. Idempotency Check
        if (idempotencyKey) {
            const cached = await db.query('SELECT response_body FROM idempotency_keys WHERE key = $1 AND merchant_id = $2', [idempotencyKey, req.merchantId]);
            if (cached.rows.length > 0) {
                return res.status(200).json(cached.rows[0].response_body);
            }
        }

        // B. Use authenticated merchant ID
        const merchantId = req.merchantId;

        // C. Create Payment Record
        const paymentId = 'pay_' + uuidv4().replace(/-/g, '').substring(0, 15);
        await db.query(
            'INSERT INTO payments (id, order_id, merchant_id, amount, status, method) VALUES ($1, $2, $3, $4, $5, $6)',
            [paymentId, order_id, merchantId, amount, 'pending', method]
        );

        const responseData = { id: paymentId, order_id, amount, status: 'pending' };

        // D. Save Idempotency Key
        if (idempotencyKey) {
            await db.query(
                'INSERT INTO idempotency_keys (key, merchant_id, response_body, created_at, expires_at) VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL \'24 hours\')', 
                [idempotencyKey, merchantId, JSON.stringify(responseData)]
            );
        }

        // E. Enqueue for Async Processing
        await paymentQueue.add('process-payment', { paymentId });

        res.status(201).json(responseData);
    } catch (err) {
        console.error("Payment Error:", err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// --- 2. POST /api/v1/payments/:payment_id/refunds ---
app.post('/api/v1/payments/:payment_id/refunds', async (req, res) => {
    const { payment_id } = req.params;
    const { amount: requestedAmount, reason } = req.body;

    try {
        const paymentRes = await db.query('SELECT * FROM payments WHERE id = $1', [payment_id]);
        const payment = paymentRes.rows[0];

        if (!payment || payment.status !== 'success') {
            return res.status(400).json({ 
                error: { code: 'BAD_REQUEST_ERROR', description: 'Only successful payments can be refunded' } 
            });
        }

        // Calculate total previously refunded
        const refundsRes = await db.query(
            'SELECT SUM(amount) as total FROM refunds WHERE payment_id = $1 AND status IN (\'processed\', \'pending\')',
            [payment_id]
        );
        const totalRefunded = parseInt(refundsRes.rows[0].total || 0);

        if (requestedAmount + totalRefunded > payment.amount) {
            return res.status(400).json({ 
                error: { code: 'BAD_REQUEST_ERROR', description: 'Refund amount exceeds available balance' } 
            });
        }

        const refundId = 'rfnd_' + uuidv4().replace(/-/g, '').substring(0, 15);
        await db.query(
            'INSERT INTO refunds (id, payment_id, merchant_id, amount, reason, status) VALUES ($1, $2, $3, $4, $5, $6)',
            [refundId, payment_id, payment.merchant_id, requestedAmount, reason, 'pending']
        );

        await refundQueue.add('process-refund', { refundId });
        res.status(201).json({ id: refundId, payment_id, amount: requestedAmount, status: 'pending' });
    } catch (err) {
        console.error("Refund Error:", err);
        res.status(500).json({ error: 'Refund processing failed' });
    }
});

// --- 3. GET /api/v1/test/jobs/status ---
app.get('/api/v1/test/jobs/status', async (req, res) => {
    try {
        const [waiting, active, completed, failed] = await Promise.all([
            paymentQueue.getWaitingCount(),
            paymentQueue.getActiveCount(),
            paymentQueue.getCompletedCount(),
            paymentQueue.getFailedCount()
        ]);

        res.json({
            pending: waiting,
            processing: active,
            completed: completed,
            failed: failed,
            worker_status: "running"
        });
    } catch (err) {
        res.status(500).json({ worker_status: "stopped", error: err.message });
    }
});

// Start Server
const PORT = 8000;
app.listen(PORT, () => {
    console.log(`🚀 Payment API live on port ${PORT}`);
});

// List webhook logs (paginated) - requires auth
app.get('/api/v1/webhooks', authMiddleware, async (req, res) => {
    const limit = parseInt(req.query.limit || '10');
    const offset = parseInt(req.query.offset || '0');
    try {
        const rows = (await db.query('SELECT id, event, status, attempts, last_attempt_at, response_code, created_at FROM webhook_logs WHERE merchant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [req.merchantId, limit, offset])).rows;
        const total = (await db.query('SELECT COUNT(1) as cnt FROM webhook_logs WHERE merchant_id = $1', [req.merchantId])).rows[0].cnt;
        res.json({ data: rows, total: parseInt(total), limit, offset });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Retry a webhook log entry (manual retry) - resets attempts and enqueues a delivery
app.post('/api/v1/webhooks/:webhook_id/retry', authMiddleware, async (req, res) => {
    const { webhook_id } = req.params;
    try {
        const w = (await db.query('SELECT * FROM webhook_logs WHERE id = $1 AND merchant_id = $2', [webhook_id, req.merchantId])).rows[0];
        if (!w) return res.status(404).json({ error: 'Webhook log not found' });

        // Reset attempts and set status pending
        await db.query('UPDATE webhook_logs SET status = $1, attempts = 0, next_retry_at = NOW(), response_code = NULL, response_body = NULL WHERE id = $2', ['pending', webhook_id]);

        // Enqueue delivery job using payload when available
        const payload = w.payload ? JSON.parse(w.payload) : null;
        const paymentId = payload?.data?.payment?.id || null;

        await webhookQueue.add('send-webhook', { event: w.event, paymentId, merchantId: w.merchant_id, attempt: 1 });
        res.json({ id: webhook_id, status: 'pending', message: 'Webhook retry scheduled' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});