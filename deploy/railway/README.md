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
6. Open the RethinkDB deployment logs and confirm it is running before deploying the application.

The Railway canvas must show two separate service tiles in the same environment: `vekan-app` and `rethinkdb`. Adding `RETHINKDB_SERVERS` to the application does not create the database service automatically.

> **Required connection setting:** the database service must be named exactly `rethinkdb`, and the application must use the following plain-text value:
>
> ```dotenv
> RETHINKDB_SERVERS=rethinkdb.railway.internal:28015
> ```
>
> Do not enter an empty hostname such as `:28015`. Do not use an unresolved `${{rethinkdb.RAILWAY_PRIVATE_DOMAIN}}` reference. That previously resolved to an empty hostname and prevented the application from starting.

## 2. Create the application service

1. Add a service from the GitHub repository `Vetrivelkv/vekan_invoice_generator`.
2. Select the `main` branch and leave the root directory as `/`.
3. Railway reads `/railway.json` and builds the root `Dockerfile`.
4. Open **Variables -> RAW Editor** and use [`deploy/railway/variables.example.env`](./variables.example.env) as the template. These variables are required for the first successful application startup.

The resulting configuration should contain:

```dotenv
NODE_ENV=production
RETHINKDB_SERVERS=rethinkdb.railway.internal:28015
RETHINKDB_DB=vekan
RETHINKDB_USER=admin
RETHINKDB_TIMEOUT=20
RETHINKDB_INIT_MAX_ATTEMPTS=60
RETHINKDB_INIT_RETRY_MS=2000
JWT_ACCESS_SECRET=<a-long-random-secret>
JWT_REFRESH_SECRET=<a-different-long-random-secret>
CORS_ORIGIN=https://<your-generated-railway-domain>
```

Do not set `PORT`; Railway injects it automatically. Do not commit the JWT secrets.

For account invitations, password setup, and verified email changes, also configure:

```dotenv
APP_PUBLIC_URL=https://vekaninvoicegenerator-production.up.railway.app
RESEND_API_KEY=<your-resend-api-key>
EMAIL_FROM=Vekan Tech <accounts@your-verified-sending-domain.com>
ACCOUNT_TOKEN_EXPIRY_MINUTES=60
```

`RESEND_API_KEY` must exist only in Railway variables, never in GitHub. Railway Free and Hobby services must send through Resend's HTTPS API rather than SMTP. The default `onboarding@resend.dev` sender can only deliver to the email associated with the Resend account; verify a domain before inviting other addresses.

5. Generate a public Railway domain for `vekan-app`.
6. Replace `CORS_ORIGIN` with that exact HTTPS domain and redeploy once.
7. After adding or changing `RETHINKDB_SERVERS`, deploy the staged variable changes and manually redeploy `vekan-app`. An already-failed container will not recover after exhausting its connection attempts.

The backend runs its idempotent database initialization scripts when it starts, so a separate migration job is not required.

## RethinkDB connection troubleshooting

If the application prints `Unable to connect to RethinkDB`:

1. Confirm a second service named exactly `rethinkdb` exists and is running.
2. Confirm the application and database are in the same Railway project and environment.
3. Confirm the database source image is `rethinkdb:2.4.4-bookworm-slim`.
4. Delete and recreate `RETHINKDB_SERVERS` as the plain-text value `rethinkdb.railway.internal:28015` if Railway displays an empty or unresolved value.
5. Check the next application log line for the connection target and the underlying error:
   - `at :28015`: the hostname is empty; replace the variable with the required plain-text value and redeploy.
   - `ENOTFOUND` or `EAI_AGAIN`: the service name/environment is wrong or the database service does not exist.
   - `ECONNREFUSED`: the database service exists but is not running or is not ready.
   - authentication error: the application and database credentials do not match.

Do not add a public domain or TCP proxy to RethinkDB. Railway private networking is sufficient.

## 3. Enable continuous deployment

In the `vekan-app` service settings:

1. Keep GitHub autodeploy enabled for `main`.
2. Enable **Wait for CI** so Railway deploys only after `.github/workflows/ci.yml` succeeds.
3. Keep the healthcheck path as `/api/health`; it is also defined in `railway.json`.

After this setup, each push to `main` follows this flow:

`GitHub push -> CI checks -> Railway image build -> healthcheck -> live deployment`

## Local development

The existing `backend/docker-compose.yml` is only for running the isolated local RethinkDB container. It is not used by Railway.
