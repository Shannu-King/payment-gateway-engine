const { paymentQueue } = require('./config/queue');
const { v4: uuidv4 } = require('uuid');

(async () => {
  try {
    const paymentId = 'pay_container_test_' + uuidv4().replace(/-/g, '').substring(0, 12);
    console.log('Attempting to add job for', paymentId);
    const job = await paymentQueue.add('process-payment', { paymentId });
    console.log('Enqueued job id=', job.id, 'name=', job.name);
    process.exit(0);
  } catch (err) {
    console.error('Enqueue error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
