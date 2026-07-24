import { databaseName, r } from "../../config/rethinkdb.js";

const ARCHIVES = "invoice_archives";

const filenameChanges = [
  {
    current: "johnson new.pdf",
    expected: "009 Johnson New.pdf",
    month: 4,
  },
  {
    current: "brakes india.pdf",
    expected: "010 Brakes India.pdf",
    month: 4,
  },
];

export default async function number2019InvoiceArchivesThrough014() {
  try {
    const database = r.db(databaseName);
    const tables = await database.tableList().run();

    if (!tables.includes(ARCHIVES)) {
      return { success: true };
    }

    for (const change of filenameChanges) {
      await database
        .table(ARCHIVES)
        .filter({ year: 2019, month: change.month })
        .filter((document) =>
          document("status").default("active").eq("active"))
        .filter((document) =>
          document("filename").downcase().eq(change.current))
        .update({ filename: change.expected })
        .run();
    }

    console.log("Numbered 2019 invoice archives through bill 014");
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}
