import { databaseName, r } from "../../config/rethinkdb.js";

const ARCHIVES = "invoice_archives";

export default async function correct2018NovemberInvoiceArchives() {
  try {
    const database = r.db(databaseName);
    const tables = await database.tableList().run();

    if (!tables.includes(ARCHIVES)) {
      return { success: true };
    }

    const november2018 = database
      .table(ARCHIVES)
      .filter({ year: 2018, month: 11 });

    await november2018
      .filter((document) =>
        document("filename").downcase().eq("cap bill.pdf")
          .or(document("filename").downcase().eq("001 cap bill.pdf")))
      .update({ filename: "001 cap bill.pdf" })
      .run();

    await november2018
      .filter((document) =>
        document("filename").downcase().eq("rabia.pdf")
          .or(document("filename").downcase().eq("002 rabia.pdf")))
      .update({ filename: "002 Rabia.pdf" })
      .run();

    await november2018
      .filter((document) =>
        document("filename").downcase().eq("sri vaari complex.pdf")
          .or(document("filename").downcase().eq("valeo.pdf")))
      .update({
        status: "deleted",
        deleted_at: new Date(),
      })
      .run();

    console.log("Corrected November 2018 invoice archive records");
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}
