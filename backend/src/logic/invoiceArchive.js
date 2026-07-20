import * as invoiceArchiveModel from "../models/invoiceArchiveModel.js";

function normalizePeriod(yearValue, monthValue) {
  const year = Number(yearValue);
  const month = Number(monthValue);
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(year) || year < 2018 || year > currentYear) {
    throw new Error(`Year must be between 2018 and ${currentYear}`);
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Month must be between 1 and 12");
  }
  return { year, month };
}

export default class InvoiceArchiveLogic {
  getAll() {
    return invoiceArchiveModel.getInvoiceArchives();
  }

  importPdf({ file, year, month, sourceId, uploadedBy }) {
    const period = normalizePeriod(year, month);
    return invoiceArchiveModel.importInvoiceArchive({
      fileBuffer: file.buffer,
      filename: file.originalname,
      sourceId: sourceId?.trim() || null,
      uploadedBy,
      ...period,
    });
  }

  getPdf(documentId) {
    return invoiceArchiveModel.getInvoiceArchivePdf(documentId);
  }
}
