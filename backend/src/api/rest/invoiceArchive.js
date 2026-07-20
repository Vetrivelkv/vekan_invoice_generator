import path from "node:path";
import multer from "multer";
import asyncRoute from "../../lib/async-route.js";
import InvoiceArchiveLogic from "../../logic/invoiceArchive.js";

const invoiceArchiveLogic = new InvoiceArchiveLogic();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 100 },
  fileFilter: (_request, file, callback) => {
    const isPdf = file.mimetype === "application/pdf";
    callback(isPdf ? null : new Error("Only PDF files are allowed"), isPdf);
  },
});

export default function registerInvoiceArchiveRoutes(app) {
  app.get("/api/invoice-archives", asyncRoute(async (_request, response) => {
    response.json({ documents: await invoiceArchiveLogic.getAll() });
  }));

  app.post("/api/invoice-archives", upload.array("files", 100), asyncRoute(async (request, response) => {
    if (!request.files?.length) {
      return response.status(400).json({ detail: "At least one PDF file is required" });
    }
    const sourceIds = Array.isArray(request.body.source_id)
      ? request.body.source_id
      : request.body.source_id ? [request.body.source_id] : [];
    const results = [];
    for (let index = 0; index < request.files.length; index += 1) {
      const file = request.files[index];
      file.originalname = path
        .basename(file.originalname)
        .replace(/[^\p{L}\p{N} ._()-]/gu, "_");
      results.push(await invoiceArchiveLogic.importPdf({
        file,
        year: request.body.year,
        month: request.body.month,
        sourceId: sourceIds[index] || null,
        uploadedBy: request.user.id,
      }));
    }
    response.status(201).json({
      status: "success",
      created: results.filter((result) => result.created).length,
      skipped: results.filter((result) => !result.created).length,
      documents: results.map((result) => result.document),
    });
  }));

  app.get("/api/invoice-archives/:documentId/pdf", asyncRoute(async (request, response) => {
    const document = await invoiceArchiveLogic.getPdf(request.params.documentId);
    if (!document) return response.status(404).json({ detail: "PDF not found" });
    const file = Buffer.from(document.data_base64, "base64");
    response.set({
      "Content-Type": document.content_type || "application/pdf",
      "Content-Disposition": `inline; filename="${document.filename || `${request.params.documentId}.pdf`}"`,
      "Content-Length": file.length,
      "Cache-Control": "private, max-age=3600",
    });
    response.send(file);
  }));
}
