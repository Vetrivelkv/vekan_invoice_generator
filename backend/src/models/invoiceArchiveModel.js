import { createHash } from "node:crypto";
import { r } from "../config/rethinkdb.js";

const ARCHIVES = "invoice_archives";

export async function getInvoiceArchives() {
  return r
    .table(ARCHIVES)
    .filter((document) => document("status").default("active").eq("active"))
    .without("data_base64")
    .orderBy(r.desc("year"), r.desc("month"), r.desc("created_at"))
    .run();
}

export async function importInvoiceArchive({
  fileBuffer,
  filename,
  year,
  month,
  sourceId,
  uploadedBy,
}) {
  const sha256 = createHash("sha256").update(fileBuffer).digest("hex");
  const sourceMatch = sourceId
    ? await r
      .table(ARCHIVES)
      .getAll(sourceId, { index: "source_id" })
      .filter((document) => document("status").default("active").eq("active"))
      .nth(0)
      .default(null)
      .run()
    : null;
  const hashMatch = await r
    .table(ARCHIVES)
    .getAll(sha256, { index: "sha256" })
    .filter((document) => document("status").default("active").eq("active"))
    .nth(0)
    .default(null)
    .run();
  const existing = sourceMatch || hashMatch;
  if (existing) {
    const { data_base64: _data, ...document } = existing;
    return { created: false, document };
  }

  const result = await r.table(ARCHIVES).insert({
    filename,
    content_type: "application/pdf",
    data_base64: fileBuffer.toString("base64"),
    file_size: fileBuffer.length,
    sha256,
    source_id: sourceId || null,
    year,
    month,
    status: "active",
    uploaded_by: uploadedBy || null,
    created_at: new Date(),
  }, { returnChanges: true }).run();
  const inserted = result.changes?.[0]?.new_val;
  if (!inserted) throw new Error("Archived invoice could not be created");
  const { data_base64: _data, ...document } = inserted;
  return { created: true, document };
}

export async function getInvoiceArchivePdf(documentId) {
  const document = await r.table(ARCHIVES).get(documentId).run();
  return document?.status === "deleted" ? null : document;
}
