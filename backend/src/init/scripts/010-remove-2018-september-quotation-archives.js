import { databaseName, r } from "../../config/rethinkdb.js";

const ARCHIVES = "invoice_archives";

export default async function remove2018SeptemberQuotationArchives() {
  try {
    const database = r.db(databaseName);
    const tables = await database.tableList().run();

    if (!tables.includes(ARCHIVES)) {
      return { success: true };
    }

    await database
      .table(ARCHIVES)
      .filter({ year: 2018, month: 9 })
      .filter((document) =>
        document("status").default("active").eq("active"))
      .update({
        status: "deleted",
        deleted_at: new Date(),
      })
      .run();

    console.log("Removed September 2018 quotation archive records");
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}
