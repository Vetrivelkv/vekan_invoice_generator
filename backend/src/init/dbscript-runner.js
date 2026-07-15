import { databaseName, r } from "../config/rethinkdb.js";
import scripts from "./dbscripts.js";

const STATE_TABLE = "sys_state";
const LAST_SCRIPT_ID = "last.script.id";

export async function runDatabaseScripts() {
  const databases = await r.dbList().run();
  if (!databases.includes(databaseName)) {
    await r.dbCreate(databaseName).run();
    console.log(`Created RethinkDB database: ${databaseName}`);
  }

  const database = r.db(databaseName);
  const tables = await database.tableList().run();
  if (!tables.includes(STATE_TABLE)) {
    await database.tableCreate(STATE_TABLE).run();
  }

  const stateTable = database.table(STATE_TABLE);
  const state = await stateTable.get(LAST_SCRIPT_ID).run();
  const lastScript = state?.lastScript || null;
  const lastScriptIndex = lastScript
    ? scripts.findIndex((script) => script.key === lastScript)
    : -1;

  for (const [index, script] of scripts.entries()) {
    if (index <= lastScriptIndex) continue;
    console.log(`Executing database script: ${script.key}`);
    const result = await script.applyScript();
    if (!result?.success)
      throw result?.error || new Error(`Database script failed: ${script.key}`);
    await stateTable
      .insert(
        {
          id: LAST_SCRIPT_ID,
          lastScript: script.key,
          lastModified: new Date(),
        },
        { conflict: "replace" },
      )
      .run();
  }
}
