import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Download,
  FileText,
  Folder,
  FolderOpen,
  Pencil,
  Trash2,
  Upload,
} from 'lucide-react';
import { apiFetch, apiUrl } from '../api';

const FIRST_ARCHIVE_YEAR = 2018;
const monthNames = Array.from({ length: 12 }, (_, index) =>
  new Intl.DateTimeFormat('en-IN', { month: 'long' }).format(new Date(2024, index, 1))
);

export default function ViewInvoices() {
  const [history, setHistory] = useState([]);
  const [expandedYears, setExpandedYears] = useState({});
  const [expandedMonths, setExpandedMonths] = useState({});
  const [expandedInvoices, setExpandedInvoices] = useState({});
  const [uploadingId, setUploadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchHistory = async () => {
    try {
      setError('');
      const response = await apiFetch('/api/invoices');
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Unable to load invoices');
      setHistory(data.invoices || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const groupedHistory = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const groups = {};
    for (let year = currentYear; year >= FIRST_ARCHIVE_YEAR; year -= 1) {
      groups[year] = Array.from({ length: 12 }, () => []);
    }
    history.forEach((invoice) => {
      const date = new Date(invoice.date);
      const year = date.getFullYear();
      if (groups[year]) groups[year][date.getMonth()].push(invoice);
    });
    return groups;
  }, [history]);

  const years = Object.keys(groupedHistory).map(Number).sort((a, b) => b - a);
  const toggleYear = (year) => setExpandedYears((current) => ({ ...current, [year]: !current[year] }));
  const toggleMonth = (key) => setExpandedMonths((current) => ({ ...current, [key]: !current[key] }));
  const toggleInvoice = (id) => setExpandedInvoices((current) => ({ ...current, [id]: !current[id] }));

  const handleEdit = (id) => {
    localStorage.setItem('loadInvoiceId', id);
    navigate('/dashboard/create');
  };

  const handleDelete = async (invoice) => {
    if (!window.confirm(`Delete invoice #${invoice.bill_number}? It will be retained as a soft-deleted record.`)) return;
    setDeletingId(invoice.id);
    setError('');
    try {
      const response = await apiFetch(`/api/invoices/${invoice.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Unable to delete invoice');
      }
      setHistory((current) => current.filter((item) => item.id !== invoice.id));
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleFileChange = async (event, invoiceId) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploadingId(invoiceId);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await apiFetch(`/api/invoices/${invoiceId}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Upload failed');
      await fetchHistory();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploadingId(null);
      event.target.value = '';
    }
  };

  return (
    <section className="archive-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Invoice archive</span>
          <h1>Service records</h1>
          <p>Browse, update and manage every fire-safety service invoice.</p>
        </div>
        <div className="record-count"><strong>{history.length}</strong><span>active records</span></div>
      </div>

      {error && <div className="notice notice-error">{error}</div>}
      {isLoading && <div className="empty-state">Loading invoice archive...</div>}

      {!isLoading && years.map((year) => {
        const yearCount = groupedHistory[year].reduce((count, month) => count + month.length, 0);
        const yearOpen = expandedYears[year];
        return (
          <div className="archive-year" key={year}>
            <button className="folder-row folder-row-year" type="button" onClick={() => toggleYear(year)}>
              <span className="folder-icon">{yearOpen ? <FolderOpen size={21} /> : <Folder size={21} />}</span>
              <span className="folder-label">{year}</span>
              <span className="folder-count">{yearCount} invoices</span>
              <ChevronRight className={yearOpen ? 'chevron-open' : ''} size={19} />
            </button>

            {yearOpen && (
              <div className="archive-months">
                {groupedHistory[year].map((invoices, monthIndex) => {
                  const monthKey = `${year}-${monthIndex}`;
                  const monthOpen = expandedMonths[monthKey];
                  return (
                    <div className="archive-month" key={monthKey}>
                      <button className="folder-row folder-row-month" type="button" onClick={() => toggleMonth(monthKey)}>
                        <span className="folder-icon">{monthOpen ? <FolderOpen size={18} /> : <Folder size={18} />}</span>
                        <span className="folder-label">{monthNames[monthIndex]}</span>
                        <span className="folder-count">{invoices.length}</span>
                        <ChevronRight className={monthOpen ? 'chevron-open' : ''} size={17} />
                      </button>

                      {monthOpen && (
                        <div className="invoice-list">
                          {[...invoices].sort((a, b) => b.bill_number - a.bill_number).map((invoice) => {
                            const invoiceOpen = expandedInvoices[invoice.id];
                            return (
                              <article className="invoice-record" key={invoice.id}>
                                <button className="invoice-record-summary" type="button" onClick={() => toggleInvoice(invoice.id)}>
                                  <span className="invoice-file-icon"><FileText size={19} /></span>
                                  <span><strong>Invoice #{invoice.bill_number}</strong><small>{invoice.date}</small></span>
                                  <span className="invoice-amount">₹{Number(invoice.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                  <ChevronRight className={invoiceOpen ? 'chevron-open' : ''} size={17} />
                                </button>

                                {invoiceOpen && (
                                  <div className="invoice-actions">
                                    <button className="action-button" type="button" onClick={() => handleEdit(invoice.id)}>
                                      <Pencil size={15} /> Edit
                                    </button>
                                    <button className="action-button action-danger" type="button" disabled={deletingId === invoice.id} onClick={() => handleDelete(invoice)}>
                                      <Trash2 size={15} /> {deletingId === invoice.id ? 'Deleting...' : 'Delete'}
                                    </button>
                                    {invoice.pdf_url ? (
                                      <a className="action-button" href={apiUrl(invoice.pdf_url)} target="_blank" rel="noreferrer">
                                        <Download size={15} /> Open PDF
                                      </a>
                                    ) : <span className="no-pdf">No PDF attached</span>}
                                    <label className="action-button action-upload">
                                      <Upload size={15} /> {uploadingId === invoice.id ? 'Uploading...' : 'Upload PDF'}
                                      <input type="file" accept="application/pdf" hidden disabled={uploadingId === invoice.id} onChange={(event) => handleFileChange(event, invoice.id)} />
                                    </label>
                                  </div>
                                )}
                              </article>
                            );
                          })}
                          {!invoices.length && <div className="empty-month">No invoices in {monthNames[monthIndex]}.</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
