# Railway deployment

The production deployment uses two Railway services in one project:

- `vekan-app`: this GitHub repository, built with the root `Dockerfile`.
- `rethinkdb`: the public Docker image `rethinkdb:2.4.4-bookworm-slim` with a persistent volume.

Railway deploys the application automatically after a successful push to `main`. The GitHub Actions CI workflow verifies the code and production image first.

## 1. Create the RethinkDB service

1. Create an empty Railway project.
2. Add a service from the Docker image `rethinkdb:2.4.4-bookworm-slim`.
3. Name the service exactly `rethinkdb`.
4. Attach a Railway volume mounted at `/data` so database data survives deployments.
5. Do not generate a public domain for this service. The application connects through Railway private networking on port `28015`.

## 2. Create the application service

1. Add a service from the GitHub repository `Vetrivelkv/vekan_invoice_generator`.
2. Select the `main` branch and leave the root directory as `/`.
3. Railway reads `/railway.json` and builds the root `Dockerfile`.
4. Add these service variables:

```dotenv
NODE_ENV=production
RETHINKDB_SERVERS=rethinkdb.railway.internal:28015
RETHINKDB_DB=vekan
RETHINKDB_USER=admin
RETHINKDB_INIT_MAX_ATTEMPTS=60
RETHINKDB_INIT_RETRY_MS=2000
JWT_ACCESS_SECRET=<a-long-random-secret>
JWT_REFRESH_SECRET=<a-different-long-random-secret>
CORS_ORIGIN=https://<your-generated-railway-domain>
```

Do not set `PORT`; Railway injects it automatically. Do not commit the JWT secrets.

5. Generate a public Railway domain for `vekan-app`.
6. Replace `CORS_ORIGIN` with that exact HTTPS domain and redeploy once.

The backend runs its idempotent database initialization scripts when it starts, so a separate migration job is not required.

## 3. Enable continuous deployment

In the `vekan-app` service settings:

1. Keep GitHub autodeploy enabled for `main`.
2. Enable **Wait for CI** so Railway deploys only after `.github/workflows/ci.yml` succeeds.
3. Keep the healthcheck path as `/api/health`; it is also defined in `railway.json`.

After this setup, each push to `main` follows this flow:

`GitHub push -> CI checks -> Railway image build -> healthcheck -> live deployment`

## Local development

The existing `backend/docker-compose.yml` is only for running the isolated local RethinkDB container. It is not used by Railway.
