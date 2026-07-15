import { r } from '../config/rethinkdb.js';

const INVOICES = 'invoices';
const SETTINGS = 'app_settings';
const PDFS = 'invoice_pdfs';

export async function getInvoices() {
  return r.table(INVOICES)
    .orderBy({ index: r.desc('bill_number') })
    .filter((invoice) => invoice('status').default('active').eq('active'))
    .run();
}

export async function getInvoice(invoiceId) {
  const invoice = await r.table(INVOICES).get(invoiceId).run();
  return invoice?.status === 'deleted' ? null : invoice;
}

export async function getNextBillNumber() {
  const setting = await r.table(SETTINGS).get('current_bill_number').run();
  return Number(setting?.value ?? 127) + 1;
}

export async function createInvoice(invoiceData) {
  const existingCount = await r.table(INVOICES)
    .getAll(invoiceData.bill_number, { index: 'bill_number' })
    .count()
    .run();
  if (existingCount) throw new Error('Duplicate bill number detected. Please use a different bill number.');

  const result = await r.table(INVOICES).insert({
    ...invoiceData,
    created_at: new Date(),
  }, { returnChanges: true }).run();
  const invoice = result.changes?.[0]?.new_val;
  if (!invoice) throw new Error('Invoice could not be created');

  const currentBillNumber = (await getNextBillNumber()) - 1;
  if (Number(invoice.bill_number) >= currentBillNumber) {
    await r.table(SETTINGS).insert({
      id: 'current_bill_number',
      value: Number(invoice.bill_number),
    }, { conflict: 'update' }).run();
  }
  return [invoice];
}

export async function updateInvoice(invoiceId, invoiceData) {
  const existingInvoice = await getInvoice(invoiceId);
  if (!existingInvoice) return [];
  const result = await r.table(INVOICES).get(invoiceId).update({
    ...invoiceData,
    updated_at: new Date(),
  }, { returnChanges: true }).run();
  const invoice = result.changes?.[0]?.new_val;
  return invoice ? [invoice] : [];
}

export async function softDeleteInvoice(invoiceId, deletedBy) {
  const existingInvoice = await getInvoice(invoiceId);
  if (!existingInvoice) return false;
  const result = await r.table(INVOICES).get(invoiceId).update({
    status: 'deleted',
    deleted_at: new Date(),
    deleted_by: deletedBy || null,
    updated_at: new Date(),
  }).run();
  return result.replaced === 1 || result.unchanged === 1;
}

export async function uploadPdf(invoiceId, fileBuffer, filename) {
  const invoice = await getInvoice(invoiceId);
  if (!invoice) throw new Error('Invoice not found');
  await r.table(PDFS).insert({
    id: invoiceId,
    filename,
    content_type: 'application/pdf',
    data_base64: fileBuffer.toString('base64'),
    uploaded_at: new Date(),
  }, { conflict: 'replace' }).run();
  const pdfUrl = `/api/invoices/${invoiceId}/pdf`;
  await r.table(INVOICES).get(invoiceId).update({ pdf_url: pdfUrl }).run();
  return pdfUrl;
}

export async function getInvoicePdf(invoiceId) {
  return r.table(PDFS).get(invoiceId).run();
}
