# Production-Ready Asynchronous Payment Gateway

## 🚀 Deployment
1. **Infrastructure**: Start Docker services via `docker-compose up -d`.
2. **Setup**: Run `npm install` and `npm run build:sdk`.
3. **Services**: Start the API (`npm run api`) and the Background Worker (`npm run worker`).

## 🛠 Features & Architecture
- **Worker Service**: Manages payments, refunds, and webhooks asynchronously.
- **Idempotency**: Prevents double-charging via 24-hour key caching.
- **Webhook Reliability**: Exponential backoff (1m, 5m, 30m, 2h) with HMAC-SHA256 signatures.
- **SDK**: Embeddable `checkout.js` with cross-origin `postMessage` communication.

## 📡 API Reference
- `POST /api/v1/payments`: Initiates a transaction.
- `POST /api/v1/payments/:id/refunds`: Partial/Full refund logic.
- `GET /api/v1/test/jobs/status`: Evaluation health check for BullMQ.

## 📦 SDK Usage
Include `<script src="http://localhost:3001/checkout.js"></script>` and initialize the `PaymentGateway` class.

## 🧰 Local Development

Quick local setup:

1. Install dependencies:

```bash
npm install
```

2. Populate `.env` (example in repository root). Ensure `POSTGRES` and `REDIS` are running and `.env` points to them.

3. Create DB and role (run as Postgres superuser):

```bash
psql -U postgres -c "CREATE ROLE gateway_user WITH LOGIN PASSWORD 'gateway_pass';"
psql -U postgres -c "CREATE DATABASE payment_gateway OWNER gateway_user;"
psql -U postgres -d payment_gateway -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
psql -U postgres -d payment_gateway -f schema.sql
psql -U postgres -d payment_gateway -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gateway_user;"
```

4. Seed a test merchant:

```bash
node backend/src/seed_merchant.js
```

5. Start server and workers (choose one):

```bash
# Start server + workers in-process (dev)
node backend/src/start_with_workers.js

# Or use pm2 (requires pm2 installed globally)
npm run pm2:start

# Or run separately
node backend/src/server.js
node backend/src/workers/index.js
```

6. Trigger a test payment:

```bash
node backend/src/test_auth.js
```

7. Inspect recent payments:

```bash
node backend/src/check_payments.js
```

If jobs are stuck `pending`, ensure `redis` is reachable and a worker is running (`node backend/src/workers/index.js` or `pm2`).
