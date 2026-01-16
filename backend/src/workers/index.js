const PaymentWorker = require('./PaymentWorker');
const RefundWorker = require('./RefundWorker');
const WebhookWorker = require('./WebhookWorker');

console.log('🚀 Payment Gateway Workers are live!');
console.log('- Payment Worker: Listening...');
console.log('- Refund Worker: Listening...');
console.log('- Webhook Worker: Listening...');

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down workers...');
});