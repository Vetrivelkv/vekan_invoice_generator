import { databaseName, r } from "../../config/rethinkdb.js";

const indexes = {
  invoices: ["bill_number", "status", "company_id"],
  companies: ["name", "gst_number"],
};

export default async function createIndexes() {
  try {
    const database = r.db(databaseName);
    for (const [tableName, desiredIndexes] of Object.entries(indexes)) {
      const table = database.table(tableName);
      const existingIndexes = await table.indexList().run();
      const missingIndexes = desiredIndexes.filter(
        (index) => !existingIndexes.includes(index),
      );
      for (const index of missingIndexes) {
        await table.indexCreate(index).run();
        console.log(`Created index: ${tableName}.${index}`);
      }
      if (missingIndexes.length) await table.indexWait(...missingIndexes).run();
    }
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}
