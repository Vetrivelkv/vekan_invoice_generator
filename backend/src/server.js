import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import registerAuthRoutes, { requireSession } from "./api/rest/auth.js";
import registerCompanyRoutes from "./api/rest/company.js";
import registerInvoiceRoutes from "./api/rest/invoice.js";
import registerUserRoutes from "./api/rest/user.js";
import { initializeDatabase } from "./init/index.js";

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

app.get("/api/health", (_request, response) => response.json({ status: "ok" }));
registerAuthRoutes(app);

app.use("/api", requireSession);
registerCompanyRoutes(app);
registerInvoiceRoutes(app);
registerUserRoutes(app);

const frontendDist = path.join(projectRoot, "frontend", "dist");
app.use(express.static(frontendDist));
app.get("*", (request, response, next) => {
  if (request.path.startsWith("/api/")) return next();
  response.sendFile(path.join(frontendDist, "index.html"));
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response
    .status(error.status || 400)
    .json({ detail: error.message || "Unexpected server error" });
});

async function start() {
  await initializeDatabase();
  app.listen(port, () =>
    console.log(`Vekan API listening on http://localhost:${port}`),
  );
}

start().catch((error) => {
  console.error("Unable to start Vekan backend:", error);
  process.exitCode = 1;
});
