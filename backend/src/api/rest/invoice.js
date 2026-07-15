import path from 'node:path';
import multer from 'multer';
import asyncRoute from '../../lib/async-route.js';
import InvoiceLogic from '../../logic/invoice.js';

const invoiceLogic = new InvoiceLogic();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    const isPdf = file.mimetype === 'application/pdf';
    callback(isPdf ? null : new Error('Only PDF files are allowed'), isPdf);
  },
});

export default function registerInvoiceRoutes(app) {
  app.get('/api/next_bill_number', asyncRoute(async (_request, response) => {
    response.json({ next_bill_number: await invoiceLogic.getNextBillNumber() });
  }));

  app.post('/api/invoices', asyncRoute(async (request, response) => {
    response.status(201).json({ status: 'success', data: await invoiceLogic.create(request.body) });
  }));

  app.get('/api/invoices', asyncRoute(async (_request, response) => {
    response.json({ invoices: await invoiceLogic.getAll() });
  }));

  app.get('/api/invoices/:invoiceId', asyncRoute(async (request, response) => {
    const invoice = await invoiceLogic.getById(request.params.invoiceId);
    if (!invoice) return response.status(404).json({ detail: 'Invoice not found' });
    response.json({ status: 'success', data: invoice });
  }));

  app.put('/api/invoices/:invoiceId', asyncRoute(async (request, response) => {
    const data = await invoiceLogic.update(request.params.invoiceId, request.body);
    response.json({ status: 'success', data });
  }));

  app.delete('/api/invoices/:invoiceId', asyncRoute(async (request, response) => {
    const deleted = await invoiceLogic.softDelete(request.params.invoiceId, request.user.id);
    if (!deleted) return response.status(404).json({ detail: 'Invoice not found' });
    response.status(204).end();
  }));

  app.post('/api/invoices/:invoiceId/upload', upload.single('file'), asyncRoute(async (request, response) => {
    if (!request.file) return response.status(400).json({ detail: 'A PDF file is required' });
    const safeFilename = path.basename(request.file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const url = await invoiceLogic.uploadPdf(request.params.invoiceId, request.file.buffer, safeFilename);
    response.json({ status: 'success', url });
  }));

  app.get('/api/invoices/:invoiceId/pdf', asyncRoute(async (request, response) => {
    const pdf = await invoiceLogic.getPdf(request.params.invoiceId);
    if (!pdf) return response.status(404).json({ detail: 'PDF not found' });
    const file = Buffer.from(pdf.data_base64, 'base64');
    response.set({
      'Content-Type': pdf.content_type || 'application/pdf',
      'Content-Disposition': `inline; filename="${pdf.filename || `${request.params.invoiceId}.pdf`}"`,
      'Content-Length': file.length,
    });
    response.send(file);
  }));
}
