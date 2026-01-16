const { paymentQueue, refundQueue, webhookQueue, connection } = require('./config/queue');

(async () => {
  try {
    console.log('Checking Redis connection and queue counts...');
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      paymentQueue.getWaitingCount(),
      paymentQueue.getActiveCount(),
      paymentQueue.getCompletedCount(),
      paymentQueue.getFailedCount(),
      paymentQueue.getDelayedCount()
    ]);

    console.log('payment-queue counts:', { waiting, active, completed, failed, delayed });

    const rWaiting = await refundQueue.getWaitingCount();
    console.log('refund-queue waiting:', rWaiting);

    const wWaiting = await webhookQueue.getWaitingCount();
    console.log('webhook-queue waiting:', wWaiting);

    // also show Redis status
    const redisInfo = await connection.info();
    console.log('Redis INFO snippets:', redisInfo.split('\n').slice(0,10).join('\n'));
    process.exit(0);
  } catch (err) {
    console.error('Queue status error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
