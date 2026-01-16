const { Queue } = require('bullmq');
const IORedis = require('ioredis');
require('dotenv').config();

const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });

const paymentQueue = new Queue('payment-queue', { connection });
const refundQueue = new Queue('refund-queue', { connection });
const webhookQueue = new Queue('webhook-queue', { connection });

module.exports = { paymentQueue, refundQueue, webhookQueue, connection };
