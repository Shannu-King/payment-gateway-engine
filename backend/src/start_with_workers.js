// Starts the API server and worker processes in the same Node process
// Useful for local development where a process supervisor isn't used.

require('dotenv').config();

// Start server (server.js listens on require)
require('./server');

// Start existing workers (index prints status and requires worker modules)
require('./workers/index');

// Additionally start the enhanced payment worker to ensure robust logging
require('./workers/PaymentWorkerEnhanced');

console.log('Started server + workers (in-process). Use SIGINT/Ctrl-C to stop.');

process.on('SIGINT', () => {
  console.log('Received SIGINT — exiting.');
  process.exit(0);
});
