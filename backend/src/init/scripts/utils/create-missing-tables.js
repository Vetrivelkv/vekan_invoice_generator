import { databaseName, r } from '../../../config/rethinkdb.js';

export async function createMissingTables(tableNames) {
  try {
    const database = r.db(databaseName);
    const existingTables = await database.tableList().run();
    const missingTables = tableNames.filter((table) => !existingTables.includes(table));

    for (const table of missingTables) {
      await database.tableCreate(table).run();
      console.log(`Created table: ${table}`);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}
