const axios = require('axios');

(async () => {
  try {
    const res = await axios.post('http://localhost:8000/api/v1/payments', {
      order_id: 'ORDER_TEST_1',
      amount: 1000,
      method: 'upi'
    }, {
      headers: {
        'x-api-key': 'test_key_abc123',
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    console.log('Auth test response status:', res.status);
    console.log('Body:', res.data);
  } catch (err) {
    if (err.response) {
      console.error('Auth test failed:', err.response.status, err.response.data);
    } else {
      console.error('Auth test error:', err.message);
    }
    process.exit(1);
  }
})();
