import { createMissingTables } from "./utils/create-missing-tables.js";
import { r } from "../../config/rethinkdb.js";

export default async function createInvoiceArchives() {
  try {
    const tableResult = await createMissingTables(["invoice_archives"]);
    if (!tableResult.success) return tableResult;

    const indexes = await r.table("invoice_archives").indexList().run();
    for (const index of ["source_id", "sha256"]) {
      if (!indexes.includes(index)) {
        await r.table("invoice_archives").indexCreate(index).run();
      }
    }
    await r.table("invoice_archives").indexWait("source_id", "sha256").run();

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}
