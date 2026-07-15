import "dotenv/config";
import { closeDatabase } from "../config/rethinkdb.js";
import { initializeDatabase } from "./index.js";

try {
  await initializeDatabase();
} finally {
  await closeDatabase();
}
