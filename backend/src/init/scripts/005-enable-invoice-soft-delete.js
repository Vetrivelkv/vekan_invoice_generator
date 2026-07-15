import { databaseName, r } from "../../config/rethinkdb.js";

export default async function enableInvoiceSoftDelete() {
  try {
    await r.db(databaseName)
      .table("invoices")
      .filter((invoice) => invoice.hasFields("status").not())
      .update({ status: "active" })
      .run();
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}
