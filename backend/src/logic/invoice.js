import * as invoiceModel from '../models/invoiceModel.js';

function normalizeInvoice(body) {
  const billNumber = body.bill_number == null ? null : Number(body.bill_number);
  if (billNumber !== null && !Number.isInteger(billNumber)) throw new Error('Bill number must be an integer');
  if (!body.date) throw new Error('Invoice date is required');
  if (!Array.isArray(body.items)) throw new Error('Invoice items must be an array');

  return {
    bill_number: billNumber,
    date: body.date,
    po_date: body.po_date || null,
    po_number: body.po_number || '',
    to_details: body.to_details || '',
    items: body.items,
    subtotal: Number(body.subtotal) || 0,
    sgst: Number(body.sgst) || 0,
    cgst: Number(body.cgst) || 0,
    grand_total: Number(body.grand_total) || 0,
    seal_path: body.seal_path || null,
    sign_path: body.sign_path || null,
    company_id: body.company_id || null,
  };
}

export default class InvoiceLogic {
  getAll() {
    return invoiceModel.getInvoices();
  }

  getById(invoiceId) {
    return invoiceModel.getInvoice(invoiceId);
  }

  getNextBillNumber() {
    return invoiceModel.getNextBillNumber();
  }

  async create(input) {
    const invoice = normalizeInvoice(input);
    if (invoice.bill_number === null) invoice.bill_number = await invoiceModel.getNextBillNumber();
    invoice.status = 'active';
    return invoiceModel.createInvoice(invoice);
  }

  update(invoiceId, input) {
    return invoiceModel.updateInvoice(invoiceId, normalizeInvoice(input));
  }

  softDelete(invoiceId, deletedBy) {
    if (!invoiceId) throw new Error('Invoice ID is required');
    return invoiceModel.softDeleteInvoice(invoiceId, deletedBy);
  }

  uploadPdf(invoiceId, fileBuffer, filename) {
    return invoiceModel.uploadPdf(invoiceId, fileBuffer, filename);
  }

  getPdf(invoiceId) {
    return invoiceModel.getInvoicePdf(invoiceId);
  }
}
