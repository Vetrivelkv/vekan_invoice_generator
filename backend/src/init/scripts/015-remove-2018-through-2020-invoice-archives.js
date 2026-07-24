import { databaseName, r } from "../../config/rethinkdb.js";

const ARCHIVES = "invoice_archives";

export default async function remove2018Through2020InvoiceArchives() {
  try {
    const database = r.db(databaseName);
    const tables = await database.tableList().run();

    if (!tables.includes(ARCHIVES)) {
      return { success: true };
    }

    await database
      .table(ARCHIVES)
      .filter((document) =>
        document("year").eq(2018)
          .or(document("year").eq(2019))
          .or(document("year").eq(2020)))
      .filter((document) =>
        document("status").default("active").eq("active"))
      .update({
        status: "deleted",
        deleted_at: new Date(),
      })
      .run();

    console.log("Removed invoice archives from 2018 through 2020");
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}
