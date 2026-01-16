(async () => {
  try {
    const res = await fetch('http://localhost:8000/api/v1/payments', {
      method: 'POST',
      headers: {
        'X-Api-Key': 'test_key_abc123',
        'Idempotency-Key': 'test_idemp_final',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ order_id: 'ORDER_FINAL_01', amount: 1000, method: 'upi' })
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text);
  } catch (err) {
    console.error('Request error:', err && err.stack ? err.stack : err);
  }
})();
