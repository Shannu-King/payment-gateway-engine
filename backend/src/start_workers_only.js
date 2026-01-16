// Start only the worker processes (no HTTP server)
require('dotenv').config();
require('./workers/index');
require('./workers/PaymentWorkerEnhanced');
// WebhookWorker is required by index, but require explicitly to be safe
require('./workers/WebhookWorker');

console.log('Started workers only.');

process.on('SIGINT', () => {
  console.log('Stopping workers...');
  process.exit(0);
});
