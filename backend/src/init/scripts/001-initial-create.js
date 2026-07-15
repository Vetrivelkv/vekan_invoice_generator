import { createMissingTables } from "./utils/create-missing-tables.js";

export default async function initialCreate() {
  return createMissingTables([
    "invoices",
    "companies",
    "app_settings",
    "invoice_pdfs",
  ]);
}
