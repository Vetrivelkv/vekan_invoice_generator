import { createMissingTables } from "./utils/create-missing-tables.js";

export default async function createInvoiceArchives(r) {
  await createMissingTables(["invoice_archives"]);

  const indexes = await r.table("invoice_archives").indexList().run();
  for (const index of ["source_id", "sha256"]) {
    if (!indexes.includes(index)) {
      await r.table("invoice_archives").indexCreate(index).run();
    }
  }
  await r.table("invoice_archives").indexWait("source_id", "sha256").run();
}
