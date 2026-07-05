import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ViewInvoices() {
  const [history, setHistory] = useState([]);
  const [expandedYears, setExpandedYears] = useState({});
  const [expandedMonths, setExpandedMonths] = useState({});
  const [expandedInvoices, setExpandedInvoices] = useState({});
  const fileInputRef = useRef(null);
  const [uploadingId, setUploadingId] = useState(null);
  const navigate = useNavigate();

  const fetchHistory = () => {
    fetch('http://127.0.0.1:8000/api/invoices')
      .then(res => res.json())
      .then(data => {
        if (data.invoices) setHistory(data.invoices);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Filter and group by 2018-2026 and months 1-12
  const groupedHistory = {};
  for (let y = 2026; y >= 2018; y--) {
    groupedHistory[y] = {};
    for (let m = 12; m >= 1; m--) {
      groupedHistory[y][m] = [];
    }
  }

  history.forEach(inv => {
    const d = new Date(inv.date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1-12
    if (year >= 2018 && year <= 2026) {
      groupedHistory[year][month].push(inv);
    }
  });

  const years = Object.keys(groupedHistory).map(Number).sort((a,b) => b - a);

  const toggleYear = year => setExpandedYears(p => ({...p, [year]: !p[year]}));
  const toggleMonth = monthKey => setExpandedMonths(p => ({...p, [monthKey]: !p[monthKey]}));
  const toggleInvoice = id => setExpandedInvoices(p => ({...p, [id]: !p[id]}));

  const handleEdit = (id) => {
    localStorage.setItem('loadInvoiceId', id);
    navigate('/dashboard/create');
  };

  const handleFileChange = async (e, invoiceId) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingId(invoiceId);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/invoices/${invoiceId}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      alert("PDF Uploaded Successfully!");
      fetchHistory(); // Refresh to get the new PDF url
    } catch (err) {
      alert("Error uploading PDF: " + err.message);
    } finally {
      setUploadingId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', height: '100%', overflowY: 'auto', padding: '30px' }}>
      <h2 style={{ color: 'var(--accent)', marginBottom: '30px', borderBottom: '2px solid var(--border)', paddingBottom: '10px' }}>View Invoices (2018 - 2026)</h2>
      
      {years.map(year => (
        <div key={year} style={{ marginBottom: '15px' }}>
          <div 
            onClick={() => toggleYear(year)} 
            style={{ cursor: 'pointer', fontWeight: 'bold', background: 'rgba(255,255,255,0.1)', padding: '10px 15px', borderRadius: '6px', fontSize: '18px', display: 'flex', alignItems: 'center' }}
          >
            <span style={{ marginRight: '10px', fontSize: '20px' }}>{expandedYears[year] ? '📂' : '📁'}</span> {year}
          </div>
          
          {expandedYears[year] && (
            <div style={{ paddingLeft: '30px', marginTop: '10px' }}>
              {[12,11,10,9,8,7,6,5,4,3,2,1].map(month => {
                const monthKey = `${year}-${month}`;
                const hasInvoices = groupedHistory[year][month].length > 0;
                
                return (
                  <div key={monthKey} style={{ marginBottom: '10px' }}>
                    <div 
                      onClick={() => toggleMonth(monthKey)} 
                      style={{ cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}
                    >
                      <span style={{ marginRight: '10px', opacity: hasInvoices ? 1 : 0.5 }}>{expandedMonths[monthKey] ? '📂' : '📁'}</span> 
                      Month {month} <span style={{ marginLeft: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>({groupedHistory[year][month].length} invoices)</span>
                    </div>
                    
                    {expandedMonths[monthKey] && (
                      <div style={{ paddingLeft: '30px', marginTop: '5px' }}>
                        {groupedHistory[year][month].sort((a,b) => b.bill_number - a.bill_number).map(inv => (
                          <div key={inv.id} style={{ marginBottom: '5px' }}>
                            <div 
                              onClick={() => toggleInvoice(inv.id)}
                              style={{ cursor: 'pointer', padding: '8px', background: 'rgba(26,26,203,0.1)', borderRadius: '4px', border: '1px solid rgba(26,26,203,0.3)', display: 'flex', alignItems: 'center' }}
                            >
                              <span style={{ marginRight: '10px' }}>📄</span> Bill #{inv.bill_number}
                            </div>
                            
                            {expandedInvoices[inv.id] && (
                              <div style={{ padding: '10px 20px', background: 'rgba(0,0,0,0.2)', borderBottomLeftRadius: '4px', borderBottomRightRadius: '4px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <button className="btn-secondary" onClick={() => handleEdit(inv.id)} style={{ fontSize: '12px', padding: '5px 10px' }}>
                                  ✏️ Editor Version
                                </button>
                                
                                {inv.pdf_url ? (
                                  <a href={inv.pdf_url} target="_blank" rel="noreferrer" className="btn-primary" style={{ fontSize: '12px', padding: '5px 10px', textDecoration: 'none', display: 'inline-block' }}>
                                    📥 PDF Version
                                  </a>
                                ) : (
                                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No PDF Attached</span>
                                )}
                                
                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <label style={{ cursor: 'pointer', fontSize: '12px', background: 'var(--border)', padding: '5px 10px', borderRadius: '4px' }}>
                                    {uploadingId === inv.id ? 'Uploading...' : '⬆️ Upload PDF'}
                                    <input 
                                      type="file" 
                                      accept="application/pdf" 
                                      style={{ display: 'none' }} 
                                      onChange={(e) => handleFileChange(e, inv.id)} 
                                      disabled={uploadingId === inv.id}
                                    />
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        {groupedHistory[year][month].length === 0 && (
                          <div style={{ padding: '5px 10px', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '12px' }}>No invoices for this month.</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
