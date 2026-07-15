import { r } from "../config/rethinkdb.js";
import { runDatabaseScripts } from "./dbscript-runner.js";

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForRethinkDb() {
  const maxAttempts = Number(process.env.RETHINKDB_INIT_MAX_ATTEMPTS) || 20;
  const retryMilliseconds = Number(process.env.RETHINKDB_INIT_RETRY_MS) || 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await r.expr(1).run();
      return;
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      console.log(
        `Unable to connect to RethinkDB. Attempt ${attempt}/${maxAttempts}`,
      );
      await sleep(retryMilliseconds);
    }
  }
}

export async function initializeDatabase() {
  await waitForRethinkDb();
  await runDatabaseScripts();
  console.log("RethinkDB initialization scripts complete.");
}
