import rethinkdbdash from 'rethinkdbdash';

export const databaseName = process.env.RETHINKDB_DB || 'vekan';

export const databaseServers = (process.env.RETHINKDB_SERVERS || '127.0.0.1:28015')
  .split(',')
  .map((server) => {
    const [host, port = '28015'] = server.trim().split(':');
    return { host, port: Number(port) };
  });

const connectionOptions = {
  ...databaseServers[0],
  db: databaseName,
  timeout: Number(process.env.RETHINKDB_TIMEOUT) || 20,
  pingInterval: -1,
};

if (process.env.RETHINKDB_USER) connectionOptions.user = process.env.RETHINKDB_USER;
if (process.env.RETHINKDB_PASSWORD) connectionOptions.password = process.env.RETHINKDB_PASSWORD;

// The built-in rethinkdbdash pool keeps a large connection buffer and retries in
// the background. A single RethinkDB connection can multiplex this low-traffic
// application's queries, so manage one lazily and close it when the app is idle.
export const r = rethinkdbdash({
  ...connectionOptions,
  pool: false,
});

const idleTimeoutMs = Number(process.env.RETHINKDB_IDLE_TIMEOUT_MS) || 30_000;
const originalRun = r._Term.prototype.run;
let connection;
let connectionPromise;
let idleTimer;
let activeQueries = 0;
let closingPromise;
let lastConnectionError;

function clearIdleTimer() {
  if (!idleTimer) return;
  clearTimeout(idleTimer);
  idleTimer = undefined;
}

function isOpen(candidate) {
  return candidate?._isOpen?.() === true;
}

function markDisconnected(candidate, error) {
  if (candidate !== connection) return;
  connection = undefined;
  lastConnectionError = error;
}

async function openConnection() {
  if (isOpen(connection)) return connection;
  if (connectionPromise) return connectionPromise;
  if (closingPromise) await closingPromise;

  connectionPromise = r.connect(connectionOptions)
    .then((openedConnection) => {
      connection = openedConnection;
      lastConnectionError = undefined;
      openedConnection.on("error", (error) => markDisconnected(openedConnection, error));
      openedConnection.on("end", () => markDisconnected(openedConnection));
      return openedConnection;
    })
    .catch((error) => {
      lastConnectionError = error;
      throw error;
    })
    .finally(() => {
      connectionPromise = undefined;
    });

  return connectionPromise;
}

function scheduleIdleClose() {
  clearIdleTimer();
  if (activeQueries > 0 || !connection) return;

  idleTimer = setTimeout(() => {
    if (activeQueries === 0) {
      closeDatabase().catch((error) => {
        console.warn("Unable to close the idle RethinkDB connection:", error.message);
      });
    }
  }, idleTimeoutMs);
  idleTimer.unref?.();
}

async function runWithLazyConnection(term, runOptions = {}) {
  clearIdleTimer();
  activeQueries += 1;

  try {
    const activeConnection = await openConnection();
    return await originalRun.call(term, activeConnection, runOptions);
  } catch (error) {
    const transientCodes = new Set([
      "ECONNREFUSED",
      "ECONNRESET",
      "EPIPE",
      "ETIMEDOUT",
      "ENETUNREACH",
      "EHOSTUNREACH",
    ]);
    const connectionFailed = transientCodes.has(error.code)
      || /closed connection|failed to connect|socket|network/i.test(error.message || "");
    if (connectionFailed && connection) {
      const failedConnection = connection;
      markDisconnected(failedConnection, error);
      if (isOpen(failedConnection)) {
        failedConnection.close({ noreplyWait: false }).catch(() => {});
      }
    }
    throw error;
  } finally {
    activeQueries -= 1;
    scheduleIdleClose();
  }
}

// Preserve the application's existing `term.run(options)` interface while
// routing every query through the lazy connection manager above.
r._Term.prototype.run = function managedRun(connectionOrOptions, options, callback) {
  if (connectionOrOptions?._isConnection?.() === true) {
    return originalRun.call(this, connectionOrOptions, options, callback);
  }

  const runOptions = connectionOrOptions && typeof connectionOrOptions === "object"
    ? connectionOrOptions
    : {};
  const runCallback = typeof connectionOrOptions === "function"
    ? connectionOrOptions
    : typeof options === "function"
      ? options
      : callback;
  const promise = runWithLazyConnection(this, runOptions);

  if (typeof runCallback === "function") {
    promise.then((result) => runCallback(null, result), runCallback);
  }
  return promise;
};

export function getDatabaseConnectionStatus() {
  return {
    connected: isOpen(connection),
    activeQueries,
    lastError: lastConnectionError?.message,
  };
}

export async function closeDatabase() {
  clearIdleTimer();
  if (closingPromise) return closingPromise;

  closingPromise = (async () => {
    const activeConnection = connection || await connectionPromise?.catch(() => undefined);
    connection = undefined;
    if (isOpen(activeConnection)) await activeConnection.close({ noreplyWait: true });
  })().finally(() => {
    closingPromise = undefined;
  });

  return closingPromise;
}
