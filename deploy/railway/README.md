# Railway deployment

The production deployment uses two Railway services in one project:

- `vekan-app`: this GitHub repository, built with the root `Dockerfile`.
- `rethinkdb`: the public Docker image `rethinkdb:2.4.4-bookworm-slim` with a persistent volume.

The React frontend is compiled into the same image and served by the backend. Do
not create a separate Railway frontend service; it would add another deployment
without reducing load on this low-traffic application.

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
RETHINKDB_IDLE_TIMEOUT_MS=30000
RETHINKDB_INIT_MAX_ATTEMPTS=6
RETHINKDB_INIT_RETRY_MS=500
RETHINKDB_INIT_MAX_RETRY_MS=5000
SHUTDOWN_TIMEOUT_MS=10000
JWT_ACCESS_SECRET=<a-long-random-secret>
JWT_REFRESH_SECRET=<a-different-long-random-secret>
CORS_ORIGIN=https://<your-generated-railway-domain>
```

Do not set `PORT`; Railway injects it automatically. Do not commit the JWT secrets.

5. Generate a public Railway domain for `vekan-app`.
6. Replace `CORS_ORIGIN` with that exact HTTPS domain and redeploy once.
7. After adding or changing `RETHINKDB_SERVERS`, deploy the staged variable changes and manually redeploy `vekan-app`.

The backend listens for HTTP traffic immediately and runs its idempotent database
initialization in the background. If RethinkDB is temporarily unavailable, API
routes return `503 DATABASE_UNAVAILABLE`; a later request starts another bounded
initialization attempt. A separate migration job is not required.

## 3. Enable Serverless for the web service

Enable Railway Serverless manually only for the request-driven `vekan-app` service:

1. Open the Railway project and select `vekan-app`.
2. Open **Settings**.
3. Under **Deploy**, find **Serverless** and enable it.
4. Leave the `rethinkdb` database service always on. This deployment has not been
   verified as safe with a sleeping RethinkDB process, and its attached volume
   continues to incur storage cost even when compute is idle.
5. After deployment, use Railway metrics to confirm the web service actually
   reaches an inactive state. A successful health check alone does not prove sleep.

The application opens one shared RethinkDB connection on demand and closes it
after `RETHINKDB_IDLE_TIMEOUT_MS` (30 seconds by default). It does not enable
driver pings, telemetry, polling, cron jobs, or heartbeat requests. This lets the
web service become network-quiet after a request. The first request after sleep
will be slower while Railway starts the container; safe GET/HEAD/OPTIONS browser
requests retry once after a 502, 503, or 504. Writes and uploads are never retried
automatically.

`/api/health` is the lightweight Railway liveness check and performs no database
query. `/api/ready` reports initialization and connection state without opening a
database connection.

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

## 4. Enable continuous deployment

In the `vekan-app` service settings:

1. Keep GitHub autodeploy enabled for `main`.
2. Enable **Wait for CI** so Railway deploys only after `.github/workflows/ci.yml` succeeds.
3. Keep the healthcheck path as `/api/health`; it is also defined in `railway.json`.

After this setup, each push to `main` follows this flow:

`GitHub push -> CI checks -> Railway image build -> healthcheck -> live deployment`

## Cost controls

- Start with a conservative `vekan-app` limit such as 0.5 vCPU and 512 MB RAM,
  then adjust only after reviewing Railway metrics during PDF generation.
- RethinkDB should start at 0.5 vCPU and 512 MB RAM, but monitor memory and disk
  before lowering either limit. Do not apply limits without testing database
  startup and PDF uploads.
- Configure Railway usage alerts at a low warning threshold and at the monthly
  budget threshold you are comfortable with. Alerts are safer than assuming an
  exact saving from Serverless.
- The RethinkDB compute service and persistent volume remain the main idle-cost
  resources. Serverless primarily reduces `vekan-app` idle compute; it does not
  remove database or volume charges.

## Cold-start and rollback notes

- A cold request can briefly receive 502/503/504 while the web service or database
  connection becomes available. The frontend makes one safe retry for idempotent
  requests after `VITE_COLD_START_RETRY_MS` (default 1500 ms).
- Initialization retries are deliberately bounded; they do not create permanent
  outbound traffic when the database remains unavailable.
- To roll back the sleep-friendly database lifecycle, revert the application
  commit and redeploy. To stop Serverless without changing code, disable it under
  **Service -> Settings -> Deploy -> Serverless**. Neither action alters the
  RethinkDB volume or production data.

## Local development

The existing `backend/docker-compose.yml` is only for running the isolated local RethinkDB container. It is not used by Railway.
