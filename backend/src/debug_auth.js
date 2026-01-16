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

    console.log('Status:', res.status);
    console.log('Body:', res.data);
  } catch (err) {
    console.error('Full error:');
    console.error(err && err.toString());
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
    if (err.request) {
      console.error('No response received, request details:', err.request._header || err.request);
    }
    console.error('Stack:', err.stack);
    process.exit(1);
  }
})();
