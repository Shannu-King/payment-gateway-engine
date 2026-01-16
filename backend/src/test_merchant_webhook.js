const express = require('express');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());

const SECRET = process.env.TEST_MERCHANT_SECRET || 'whsec_test_abc123';

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'] || '';
  const payload = JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  console.log('Received webhook. Signature valid:', expected === signature);
  console.log('Event:', req.body.event);
  console.log('Body:', payload);

  // Simulate failure so worker retries
  res.status(500).send('Simulated failure');
});

const PORT = process.env.TEST_MERCHANT_PORT || 4000;
app.listen(PORT, () => console.log(`Test merchant webhook receiver listening on port ${PORT}`));
