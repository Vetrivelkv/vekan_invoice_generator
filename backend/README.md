# Vekan backend

All server-side code and configuration lives in this directory.

## Commands

```powershell
npm install
npm run dev
npm start
npm run migrate
npm run check
```

Copy `.env.example` to `.env` and provide the RethinkDB, JWT, and administrator settings before deployment.

## Isolated local database

Vekan builds its own `vekan-rethinkdb:2.4.4-local` image and uses a dedicated
`vekan-rethinkdb` container and `vekan-rethinkdb-data` volume. It binds RethinkDB to
`127.0.0.1:39015` and the admin UI to `127.0.0.1:39080`, so it does not connect
to or modify another project's RethinkDB instance on the standard port `28015`.

```powershell
docker compose up -d rethinkdb
npm run migrate
```

Do not point `RETHINKDB_SERVERS` at another project's database instance.

## Layout

- `src/` - all backend source code
- `src/api/rest/` - thin Express REST route handlers
- `src/logic/` - validation and business workflows
- `src/models/` - RethinkDB query and persistence models
- `src/lib/` - shared backend utilities
- `src/config/` - RethinkDB provider configuration
- `src/init/` - ecosystem-style database initialization and script runner
- `src/init/scripts/` - ordered, state-tracked RethinkDB migration scripts
- `.env` - local backend secrets (ignored by Git)
- `package.json` - backend-only dependencies and commands
