// POST /api/v1/payments/:payment_id/refunds
app.post('/api/v1/payments/:payment_id/refunds', async (req, res) => {
    const { payment_id } = req.params;
    const { amount: requestedAmount, reason } = req.body;

    // 1. Fetch the original payment
    const paymentRes = await db.query('SELECT * FROM payments WHERE id = $1', [payment_id]);
    const payment = paymentRes.rows[0];

    if (!payment || payment.status !== 'success') {
        return res.status(400).json({ error: { code: 'BAD_REQUEST_ERROR', description: 'Payment not in refundable state' } });
    }

    // 2. Calculate "Total Already Refunded"
    // Requirement: Sum all processed or pending refunds
    const refundsRes = await db.query(
        'SELECT SUM(amount) as total FROM refunds WHERE payment_id = $1 AND status IN (\'processed\', \'pending\')',
        [payment_id]
    );
    const totalRefunded = parseInt(refundsRes.rows[0].total || 0);

    // 3. Validation: (Total + New) <= Original
    if (requestedAmount + totalRefunded > payment.amount) {
        return res.status(400).json({ error: { code: 'BAD_REQUEST_ERROR', description: 'Refund amount exceeds available amount' } });
    }

    // 4. Create Refund Record
    const refundId = 'rfnd_' + Math.random().toString(36).substring(2, 18);
    await db.query(
        'INSERT INTO refunds (id, payment_id, merchant_id, amount, reason, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [refundId, payment_id, payment.merchant_id, requestedAmount, reason, 'pending']
    );

    // 5. Enqueue Refund Job (Async requirement)
    await refundQueue.add('process-refund', { refundId });

    res.status(201).json({ id: refundId, payment_id, amount: requestedAmount, status: 'pending' });
});