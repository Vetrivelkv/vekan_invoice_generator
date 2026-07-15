import { r } from "../config/rethinkdb.js";

const SETTINGS = "app_settings";
const INVOICES = "invoices";
const CURRENT_BILL_NUMBER = "current_bill_number";

export async function getCurrentBillNumber() {
  const setting = await r.table(SETTINGS).get(CURRENT_BILL_NUMBER).run();
  return Number(setting?.value ?? 127);
}

export async function setCurrentBillNumber(value) {
  const setting = {
    id: CURRENT_BILL_NUMBER,
    value,
    updated_at: new Date(),
  };
  await r.table(SETTINGS).insert(setting, { conflict: "update" }).run();
  return setting;
}

export async function getHighestInvoiceBillNumber() {
  const invoice = await r
    .table(INVOICES)
    .orderBy({ index: r.desc("bill_number") })
    .nth(0)
    .default(null)
    .run();
  return invoice ? Number(invoice.bill_number) : null;
}
