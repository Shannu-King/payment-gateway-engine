# Local Development — Quick Start

This file contains quick commands I used to get the project running locally.

1. Ensure Redis and Postgres are running.
2. Populate `.env` (example is in the repo root).
3. Create DB/role and apply schema (run as `postgres` superuser):

```bash
psql -U postgres -c "CREATE ROLE gateway_user WITH LOGIN PASSWORD 'gateway_pass';"
psql -U postgres -c "CREATE DATABASE payment_gateway OWNER gateway_user;"
psql -U postgres -d payment_gateway -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
psql -U postgres -d payment_gateway -f schema.sql
psql -U postgres -d payment_gateway -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gateway_user;"
```

4. Seed test merchant:

```bash
node backend/src/seed_merchant.js
```

5. Start server+workers for dev (in-process):

```bash
node backend/src/start_with_workers.js
```

6. Trigger test payment:

```bash
node backend/src/test_auth.js
```

7. Inspect recent payments:

```bash
node backend/src/check_payments.js
```

If jobs are pending: ensure `REDIS_URL` is correct and that `node backend/src/workers/index.js` or `node backend/src/start_with_workers.js` is running.
