import { databaseServers, r } from "../config/rethinkdb.js";
import { runDatabaseScripts } from "./dbscript-runner.js";
import { withBoundedBackoff } from "../lib/retry.js";

async function waitForRethinkDb() {
  const maxAttempts = Number(process.env.RETHINKDB_INIT_MAX_ATTEMPTS) || 6;
  const retryMilliseconds = Number(process.env.RETHINKDB_INIT_RETRY_MS) || 500;
  const maxRetryMilliseconds = Number(process.env.RETHINKDB_INIT_MAX_RETRY_MS) || 5000;
  const targets = databaseServers
    .map(({ host, port }) => `${host}:${port}`)
    .join(", ");

  await withBoundedBackoff(
    async () => {
      await r.expr(1).run();
    },
    {
      attempts: maxAttempts,
      initialDelayMs: retryMilliseconds,
      maxDelayMs: maxRetryMilliseconds,
      onRetry(error, attempt, delayMs) {
        const reason = [error.code, error.message]
          .filter(Boolean)
          .join(": ")
          .replace(/\s+/g, " ");
        console.warn(
          `Unable to connect to RethinkDB at ${targets}. `
            + `Attempt ${attempt}/${maxAttempts}; retrying in ${delayMs}ms. ${reason}`,
        );
      },
    },
  );
}

let initializationPromise;
let ready = false;
let initializationError;

export async function initializeDatabase() {
  if (ready) return;
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    await waitForRethinkDb();
    await runDatabaseScripts();
    ready = true;
    initializationError = undefined;
    console.log("RethinkDB initialization scripts complete.");
  })().catch((error) => {
    initializationError = error;
    throw error;
  }).finally(() => {
    initializationPromise = undefined;
  });

  return initializationPromise;
}

export function getDatabaseReadiness() {
  return {
    ready,
    initializing: Boolean(initializationPromise),
    error: initializationError?.message,
  };
}

export async function requireDatabaseReady(_request, response, next) {
  try {
    await initializeDatabase();
    next();
  } catch (error) {
    response.status(503).json({
      code: "DATABASE_UNAVAILABLE",
      detail: "The database is waking up. Please try again shortly.",
    });
  }
}
