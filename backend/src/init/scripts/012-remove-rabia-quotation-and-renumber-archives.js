import { databaseName, r } from "../../config/rethinkdb.js";

const ARCHIVES = "invoice_archives";

export default async function removeRabiaQuotationAndRenumberArchives() {
  try {
    const database = r.db(databaseName);
    const tables = await database.tableList().run();

    if (!tables.includes(ARCHIVES)) {
      return { success: true };
    }

    await database
      .table(ARCHIVES)
      .filter({ year: 2018, month: 11 })
      .filter((document) =>
        document("filename").downcase().eq("rabia.pdf")
          .or(document("filename").downcase().eq("002 rabia.pdf")))
      .filter((document) =>
        document("status").default("active").eq("active"))
      .update({
        status: "deleted",
        deleted_at: new Date(),
      })
      .run();

    const december2018 = database
      .table(ARCHIVES)
      .filter({ year: 2018, month: 12 })
      .filter((document) =>
        document("status").default("active").eq("active"));

    await december2018
      .filter((document) =>
        document("filename").downcase().eq("003 capital towers jockey pump bill.pdf")
          .or(document("filename").downcase().eq("002 capital towers jockey pump bill.pdf")))
      .update({ filename: "002 Capital Towers Jockey Pump Bill.pdf" })
      .run();

    await december2018
      .filter((document) =>
        document("filename").downcase().eq("004 kerala school bill.pdf")
          .or(document("filename").downcase().eq("003 kerala school bill.pdf")))
      .update({ filename: "003 Kerala School Bill.pdf" })
      .run();

    await december2018
      .filter((document) =>
        document("filename").downcase().eq("005 nippon bill.pdf")
          .or(document("filename").downcase().eq("004 nippon bill.pdf")))
      .update({ filename: "004 Nippon Bill.pdf" })
      .run();

    await december2018
      .filter((document) =>
        document("filename").downcase().eq("006 valeo bill.pdf")
          .or(document("filename").downcase().eq("005 valeo bill.pdf")))
      .update({ filename: "005 Valeo Bill.pdf" })
      .run();

    console.log("Removed the Rabia quotation and renumbered 2018 archives through bill 005");
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}
