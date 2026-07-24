import { databaseName, r } from "../../config/rethinkdb.js";

const ARCHIVES = "invoice_archives";

const archiveChanges = [
  {
    current: "haworth bill 13.pdf",
    expected: "015 Haworth Bill.pdf",
    year: 2019,
    month: 7,
  },
  {
    current: "spack 14.pdf",
    expected: "016 Spack Bill.pdf",
    year: 2019,
    month: 7,
  },
  {
    current: "spack civil works 15.pdf",
    expected: "017 Spack Additional Work.pdf",
    year: 2019,
    month: 7,
  },
  {
    current: "nefab india pvt.pdf",
    expected: "018 NEFAB India Bill.pdf",
    year: 2019,
    month: 9,
  },
  {
    current: "ashok_leyland.pdf",
    expected: "019 Ashok Leyland Bill.pdf",
    year: 2019,
    month: 9,
  },
  {
    current: "asahi india glass limited.pdf",
    expected: "020 ASAHI India Glass Bill.pdf",
    year: 2019,
    month: 10,
  },
  {
    current: "26_bill-spack_bus.pdf",
    expected: "021 Spack and Bus Bill.pdf",
    year: 2019,
    month: 10,
  },
  {
    current: "stahl-india28.pdf",
    expected: "022 STAHL India Bill.pdf",
    year: 2019,
    month: 12,
  },
  {
    current: "ultra-marine-29.pdf",
    expected: "023 Ultra Marine Bill.pdf",
    year: 2019,
    month: 12,
  },
  {
    current: "39-ashok-leyland.pdf",
    expected: "024 Ashok Leyland Guindy Bill.pdf",
    year: 2020,
    month: 1,
  },
  {
    current: "40-ushafires-pondicherry.pdf",
    expected: "025 Sundaram Fasteners Pondicherry Bill.pdf",
    year: 2020,
    month: 2,
  },
];

export default async function numberInvoiceArchivesThrough025() {
  try {
    const database = r.db(databaseName);
    const tables = await database.tableList().run();

    if (!tables.includes(ARCHIVES)) {
      return { success: true };
    }

    for (const change of archiveChanges) {
      await database
        .table(ARCHIVES)
        .filter({ year: change.year })
        .filter((document) =>
          document("status").default("active").eq("active"))
        .filter((document) =>
          document("filename").downcase().eq(change.current))
        .update({
          filename: change.expected,
          month: change.month,
        })
        .run();
    }

    console.log("Numbered invoice archives through bill 025");
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}
