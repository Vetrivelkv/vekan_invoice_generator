import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import registerAuthRoutes, { requireSession } from "./api/rest/auth.js";
import registerCompanyRoutes from "./api/rest/company.js";
import registerInvoiceRoutes from "./api/rest/invoice.js";
import registerInvoiceArchiveRoutes from "./api/rest/invoiceArchive.js";
import registerSettingRoutes from "./api/rest/setting.js";
import registerUserRoutes from "./api/rest/user.js";
import { closeDatabase, getDatabaseConnectionStatus } from "./config/rethinkdb.js";
import {
  getDatabaseReadiness,
  initializeDatabase,
  requireDatabaseReady,
} from "./init/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
const app = express();
const port = Number(process.env.PORT) || 8000;
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : true;

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use("/api", (_request, response, next) => {
  response.set("Cache-Control", "no-store");
  next();
});

app.get("/api/health", (_request, response) => response.json({ status: "ok" }));
app.get("/api/ready", (_request, response) => {
  const database = getDatabaseReadiness();
  const connection = getDatabaseConnectionStatus();
  response.status(database.ready ? 200 : 503).json({
    status: database.ready ? "ready" : "starting",
    database: {
      initialized: database.ready,
      initializing: database.initializing,
      connected: connection.connected,
      activeQueries: connection.activeQueries,
    },
  });
});
app.use("/api", requireDatabaseReady);
registerAuthRoutes(app);

app.use("/api", requireSession);
registerCompanyRoutes(app);
registerInvoiceRoutes(app);
registerInvoiceArchiveRoutes(app);
registerSettingRoutes(app);
registerUserRoutes(app);

const frontendDist = path.join(projectRoot, "frontend", "dist");
app.use(express.static(frontendDist, {
  setHeaders(response, filePath) {
    if (filePath.endsWith("index.html")) {
      response.setHeader("Cache-Control", "no-cache");
    } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
      response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } else {
      response.setHeader("Cache-Control", "public, max-age=3600");
    }
  },
}));
app.get("*", (request, response, next) => {
  if (request.path.startsWith("/api/")) return next();
  response.set("Cache-Control", "no-cache");
  response.sendFile(path.join(frontendDist, "index.html"));
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response
    .status(error.status || 400)
    .json({ detail: error.message || "Unexpected server error" });
});

async function start() {
  const server = app.listen(port, () =>
    console.log(`Vekan API listening on http://localhost:${port}`),
  );

  initializeDatabase().catch((error) => {
    console.warn(
      "Initial database connection did not succeed; the next API request will retry:",
      error.message,
    );
  });

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received; shutting down gracefully.`);

    const forceExitTimer = setTimeout(() => {
      console.error("Graceful shutdown timed out.");
      process.exit(1);
    }, Number(process.env.SHUTDOWN_TIMEOUT_MS) || 10_000);
    forceExitTimer.unref?.();

    server.close(async (error) => {
      try {
        if (error) throw error;
        await closeDatabase();
        clearTimeout(forceExitTimer);
        process.exit(0);
      } catch (shutdownError) {
        console.error("Unable to shut down cleanly:", shutdownError);
        process.exit(1);
      }
    });
  };

  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));

  return server;
}

start().catch((error) => {
  console.error("Unable to start Vekan backend:", error);
  process.exitCode = 1;
});
