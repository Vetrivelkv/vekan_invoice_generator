import { databaseName, r } from "../../config/rethinkdb.js";

const ARCHIVES = "invoice_archives";

export default async function number2018DecemberInvoiceArchives() {
  try {
    const database = r.db(databaseName);
    const tables = await database.tableList().run();

    if (!tables.includes(ARCHIVES)) {
      return { success: true };
    }

    const december2018 = database
      .table(ARCHIVES)
      .filter({ year: 2018, month: 12 });

    await december2018
      .filter((document) =>
        document("filename").downcase().eq("(8) capital towers jockey pump bill vekan.pdf")
          .or(document("filename").downcase().eq("003 capital towers jockey pump bill.pdf")))
      .update({ filename: "003 Capital Towers Jockey Pump Bill.pdf" })
      .run();

    await december2018
      .filter((document) =>
        document("filename").downcase().eq("(3)kerala school bill usha fires.pdf")
          .or(document("filename").downcase().eq("004 kerala school bill.pdf")))
      .update({ filename: "004 Kerala School Bill.pdf" })
      .run();

    console.log("Numbered December 2018 invoice archive records 003 and 004");
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}
