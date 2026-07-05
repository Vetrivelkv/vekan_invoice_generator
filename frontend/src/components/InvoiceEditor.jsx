import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Utility for number to words
function numToWordsINR(num) {
  if (num === 0) return "Zero Only";
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];

  let numStr = Math.floor(num).toString();
  if (numStr.length > 9) return 'Amount too large';
  let n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : 'Only';
  return "Rupees " + str.trim();
}

export default function InvoiceEditor() {
  const canvasRef = useRef(null);

  const [items, setItems] = useState([{ description: '', qty: 1, rate: 0, amount: 0 }]);
  const [toDetails, setToDetails] = useState('');
  
  const [header, setHeader] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    bill_no: '', 
    po_no: '', 
    po_date: '',
    show_po: true
  });

  const [letterhead, setLetterhead] = useState({
    name: 'Vekan Tech Enterprises',
    address: 'No.10 Thanthai Periyar Nagar, Kumananchavadi, Chennai-56.',
    phone: 'Phone: 9841644475, 8939062876',
    gstin: 'GSTIN: 33AKIPK1425D1ZQ.'
  });

  const [droppedAssets, setDroppedAssets] = useState({ seal: null, sign: null });
  const [currentInvoiceId, setCurrentInvoiceId] = useState(null);
  
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchNextBill = () => {
    fetch('http://127.0.0.1:8000/api/next_bill_number')
      .then(res => res.json())
      .then(data => {
        if(data.next_bill_number) setHeader(h => ({ ...h, bill_no: data.next_bill_number }));
      })
      .catch(console.error);
  };

  useEffect(() => {
    // Check if we have an invoice ID in localStorage to load it (passed from ViewInvoices)
    const loadId = localStorage.getItem('loadInvoiceId');
    if (loadId) {
      fetch(`http://127.0.0.1:8000/api/invoices/${loadId}`)
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            const inv = data.data;
            setCurrentInvoiceId(inv.id);
            setHeader({
              date: inv.date,
              bill_no: inv.bill_number,
              po_no: inv.po_number || '',
              po_date: inv.po_date || '',
              show_po: !!inv.po_number || !!inv.po_date
            });
            setToDetails(inv.to_details || '');
            setItems(inv.items || []);
            setDroppedAssets({
              seal: inv.seal_path || null,
              sign: inv.sign_path || null
            });
          }
        })
        .catch(console.error)
        .finally(() => {
          localStorage.removeItem('loadInvoiceId'); // clear after loading
        });
    } else {
      fetchNextBill();
    }
  }, []);

  const availableAssets = [
    { id: 'seal1', type: 'seal', src: '/extracted_images/image1_2.png', name: 'Company Seal' },
    { id: 'sign1', type: 'sign', src: '/extracted_images/image1_3.png', name: 'Signature' },
    { id: 'logo1', type: 'logo', src: '/extracted_images/image1_1.jpeg', name: 'Logo' }
  ];

  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const grandTotal = subtotal + cgst + sgst;

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === 'qty' || field === 'rate') {
      newItems[index].amount = newItems[index].qty * newItems[index].rate;
    }
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { description: '', qty: 1, rate: 0, amount: 0 }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const handleDragStart = (e, asset) => e.dataTransfer.setData('asset_str', JSON.stringify(asset));
  const handleDrop = (e, zone) => {
    e.preventDefault();
    const assetStr = e.dataTransfer.getData('asset_str');
    if (assetStr) setDroppedAssets({ ...droppedAssets, [zone]: JSON.parse(assetStr).src });
  };
  const handleDragOver = (e) => e.preventDefault();

  const handleGenerate = async () => {
    if (!header.bill_no) {
      alert("Bill Number is required!");
      return;
    }

    // 1. Save to DB
    const payload = {
      bill_number: parseInt(header.bill_no),
      date: header.date,
      po_date: header.po_date,
      po_number: header.po_no,
      to_details: toDetails,
      items: items,
      subtotal,
      sgst,
      cgst,
      grand_total: grandTotal,
      seal_path: droppedAssets.seal,
      sign_path: droppedAssets.sign
    };

    try {
      const url = currentInvoiceId 
        ? `http://127.0.0.1:8000/api/invoices/${currentInvoiceId}` 
        : `http://127.0.0.1:8000/api/invoices`;
      
      const method = currentInvoiceId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to save");
      if (!currentInvoiceId && data.data && data.data.length > 0) {
        setCurrentInvoiceId(data.data[0].id);
      }
      
      // 2. Prepare UI for PDF snapshot
      setIsGenerating(true);
      
      // Wait for React to re-render with clean divs instead of inputs
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Generate PDF
      const canvas = await html2canvas(canvasRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${header.bill_no}.pdf`);
      
    } catch (err) {
      alert("Error generating PDF: " + err.message);
    } finally {
      // Revert UI back to inputs
      setIsGenerating(false);
    }
  };

  const showPoSection = header.show_po && (!isGenerating || header.po_no || header.po_date);

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%', overflow: 'hidden' }}>
      
      {/* Editor Main Canvas Wrapper */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#e5e7eb', padding: '20px', borderRadius: '12px' }}>
        
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <button className="btn-secondary" onClick={() => {
              setCurrentInvoiceId(null);
              fetchNextBill();
              setItems([{ description: '', qty: 1, rate: 0, amount: 0 }]);
              setToDetails('');
            }}>New Invoice</button>
          </div>
          <button className="btn-primary" onClick={handleGenerate} disabled={isGenerating} style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            {isGenerating ? 'Generating...' : 'Save & Generate PDF'}
          </button>
        </div>

        {/* A4 Paper */}
        <div ref={canvasRef} style={{
          width: '800px',
          minHeight: '1131px',
          background: 'white',
          color: 'black',
          padding: '40px',
          boxShadow: isGenerating ? 'none' : '0 10px 25px rgba(0,0,0,0.2)',
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
            <div style={{ flex: '0 0 160px' }}>
              <img src="/extracted_images/image1_1.jpeg" alt="Logo" style={{ width: '160px' }} />
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              {isGenerating ? (
                <>
                  <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1a1acb' }}>{letterhead.name}</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '5px' }}>{letterhead.address}</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '2px' }}>{letterhead.phone}</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '2px' }}>{letterhead.gstin}</div>
                </>
              ) : (
                <>
                  <input 
                    style={{ width: '100%', fontSize: '48px', fontWeight: 'bold', color: '#1a1acb', textAlign: 'center', border: '1px dashed transparent', background: 'transparent', outline: 'none' }} 
                    value={letterhead.name} 
                    onChange={e => setLetterhead({...letterhead, name: e.target.value})} 
                    onFocus={e => e.target.style.border = '1px dashed #ccc'}
                    onBlur={e => e.target.style.border = '1px dashed transparent'}
                  />
                  <input 
                    style={{ width: '100%', fontSize: '16px', fontWeight: 'bold', textAlign: 'center', border: '1px dashed transparent', background: 'transparent', outline: 'none', marginTop: '5px' }} 
                    value={letterhead.address} 
                    onChange={e => setLetterhead({...letterhead, address: e.target.value})} 
                    onFocus={e => e.target.style.border = '1px dashed #ccc'}
                    onBlur={e => e.target.style.border = '1px dashed transparent'}
                  />
                  <input 
                    style={{ width: '100%', fontSize: '16px', fontWeight: 'bold', textAlign: 'center', border: '1px dashed transparent', background: 'transparent', outline: 'none', marginTop: '2px' }} 
                    value={letterhead.phone} 
                    onChange={e => setLetterhead({...letterhead, phone: e.target.value})} 
                    onFocus={e => e.target.style.border = '1px dashed #ccc'}
                    onBlur={e => e.target.style.border = '1px dashed transparent'}
                  />
                  <input 
                    style={{ width: '100%', fontSize: '16px', fontWeight: 'bold', textAlign: 'center', border: '1px dashed transparent', background: 'transparent', outline: 'none', marginTop: '2px' }} 
                    value={letterhead.gstin} 
                    onChange={e => setLetterhead({...letterhead, gstin: e.target.value})} 
                    onFocus={e => e.target.style.border = '1px dashed #ccc'}
                    onBlur={e => e.target.style.border = '1px dashed transparent'}
                  />
                </>
              )}
            </div>
            <div style={{ flex: '0 0 160px' }}></div>
          </div>

          {/* Sub Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', position: 'relative' }}>
            <div style={{ flex: '0 0 250px' }}></div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>TAX INVOICE</span>
            </div>
            <div style={{ flex: '0 0 250px', fontSize: '12px', fontWeight: 'bold', color: '#1a2a4a' }}>
              <div style={{ display: 'flex', marginBottom: '4px' }}>
                <span style={{ width: '60px' }}>Date:</span>
                {isGenerating ? (
                  <div style={{ flex: 1 }}>{header.date}</div>
                ) : (
                  <input type="date" value={header.date} onChange={e => setHeader({...header, date: e.target.value})} style={{ border: '1px dashed transparent', background: 'transparent', outline: 'none', flex: 1, fontSize: '12px', fontWeight: 'bold', fontFamily: 'inherit' }} />
                )}
              </div>
              <div style={{ display: 'flex', marginBottom: '4px' }}>
                <span style={{ width: '60px' }}>Bill No:</span>
                {isGenerating ? (
                  <div style={{ flex: 1 }}>{header.bill_no}</div>
                ) : (
                  <input type="number" value={header.bill_no} onChange={e => setHeader({...header, bill_no: parseInt(e.target.value) || ''})} style={{ border: '1px dashed transparent', background: 'transparent', outline: 'none', flex: 1, fontSize: '12px', fontWeight: 'bold', fontFamily: 'inherit' }} />
                )}
              </div>
              
              {showPoSection && (
                <>
                  <div style={{ display: 'flex', marginBottom: '4px' }}>
                    <span style={{ width: '60px' }}>PO NO:</span>
                    {isGenerating ? (
                      <div style={{ flex: 1 }}>{header.po_no}</div>
                    ) : (
                      <input value={header.po_no} onChange={e => setHeader({...header, po_no: e.target.value})} style={{ border: '1px dashed transparent', background: 'transparent', outline: 'none', flex: 1, fontSize: '12px', fontWeight: 'bold', fontFamily: 'inherit' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', marginBottom: '4px' }}>
                    <span style={{ width: '60px' }}>PO. DATE:</span>
                    {isGenerating ? (
                      <div style={{ flex: 1 }}>{header.po_date}</div>
                    ) : (
                      <input type="date" value={header.po_date} onChange={e => setHeader({...header, po_date: e.target.value})} style={{ border: '1px dashed transparent', background: 'transparent', outline: 'none', flex: 1, fontSize: '12px', fontWeight: 'bold', fontFamily: 'inherit' }} />
                    )}
                  </div>
                </>
              )}
              
              {!isGenerating && (
                <div style={{ fontSize: '10px', textAlign: 'right', marginTop: '5px' }}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setHeader({...header, show_po: !header.show_po}); }} style={{ color: 'blue', textDecoration: 'none' }}>Toggle PO Fields</a>
                </div>
              )}
            </div>
          </div>

          {/* TO Section */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a1acb', marginBottom: '5px' }}>TO</div>
            {isGenerating ? (
               <div style={{ width: '50%', fontSize: '12px', whiteSpace: 'pre-wrap' }}>{toDetails}</div>
            ) : (
              <textarea 
                value={toDetails} 
                onChange={e => setToDetails(e.target.value)}
                placeholder="Company Name&#10;Address&#10;GSTIN"
                style={{ width: '50%', height: '80px', border: '1px dashed #ccc', background: 'transparent', outline: 'none', fontSize: '12px', resize: 'none', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.border = '1px dashed #666'} 
                onBlur={e => e.target.style.border = '1px dashed #ccc'}
              />
            )}
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #1a2a4a', borderBottom: '2px solid #1a2a4a', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#1a2a4a', color: 'white', textAlign: 'center' }}>
                <th style={{ padding: '8px', borderRight: '1px solid white', width: '40px' }}>S.No.</th>
                <th style={{ padding: '8px', borderRight: '1px solid white' }}>Description</th>
                <th style={{ padding: '8px', borderRight: '1px solid white', width: '60px' }}>Qty</th>
                <th style={{ padding: '8px', borderRight: '1px solid white', width: '100px' }}>Rate (INR)</th>
                <th style={{ padding: '8px', width: '120px' }}>Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={{ height: '30px', borderBottom: '1px solid #1a2a4a' }}>
                  <td style={{ borderRight: '1px solid #1a2a4a', textAlign: 'center' }}>
                    {!isGenerating && <button onClick={() => removeItem(idx)} style={{ border: 'none', background: 'transparent', color: 'red', cursor: 'pointer', fontSize: '10px', padding: 0, marginRight: '5px' }} title="Remove Row">x</button>}
                    {idx + 1}
                  </td>
                  <td style={{ borderRight: '1px solid #1a2a4a', padding: '0 5px' }}>
                    {isGenerating ? (
                      <div>{item.description}</div>
                    ) : (
                      <input placeholder="Enter description" value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', fontFamily: 'inherit' }} />
                    )}
                  </td>
                  <td style={{ borderRight: '1px solid #1a2a4a', textAlign: 'center' }}>
                    {isGenerating ? (
                      <div>{item.qty}</div>
                    ) : (
                      <input type="number" value={item.qty} onChange={e => handleItemChange(idx, 'qty', parseFloat(e.target.value) || 0)} style={{ width: '40px', border: 'none', background: 'transparent', outline: 'none', textAlign: 'center', fontSize: '12px', fontFamily: 'inherit' }} />
                    )}
                  </td>
                  <td style={{ borderRight: '1px solid #1a2a4a', textAlign: 'right', padding: '0 5px' }}>
                    {isGenerating ? (
                      <div>{item.rate}</div>
                    ) : (
                      <input type="number" value={item.rate} onChange={e => handleItemChange(idx, 'rate', parseFloat(e.target.value) || 0)} style={{ width: '80px', border: 'none', background: 'transparent', outline: 'none', textAlign: 'right', fontSize: '12px', fontFamily: 'inherit' }} />
                    )}
                  </td>
                  <td style={{ textAlign: 'right', padding: '0 5px' }}>
                    {item.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
              
              {!isGenerating && (
                <tr><td colSpan="5" style={{ padding: '5px', borderBottom: '1px solid #1a2a4a' }}><button onClick={addItem} style={{ fontSize: '10px', padding: '2px 5px', cursor: 'pointer' }}>+ Add Row</button></td></tr>
              )}
              
              <tr style={{ height: '30px', borderBottom: '1px solid #1a2a4a' }}>
                <td colSpan="4" style={{ textAlign: 'right', paddingRight: '5px', fontWeight: 'bold' }}>CGST 9%</td>
                <td style={{ textAlign: 'right', padding: '0 5px' }}>{cgst.toFixed(2)}</td>
              </tr>
              <tr style={{ height: '30px', borderBottom: '1px solid #1a2a4a' }}>
                <td colSpan="4" style={{ textAlign: 'right', paddingRight: '5px', fontWeight: 'bold' }}>SGST 9%</td>
                <td style={{ textAlign: 'right', padding: '0 5px' }}>{sgst.toFixed(2)}</td>
              </tr>
              
              <tr style={{ background: '#e0e7ff', height: '35px', fontWeight: 'bold', color: '#1a2a4a', borderBottom: '2px solid #1a2a4a' }}>
                <td colSpan="4" style={{ textAlign: 'right', paddingRight: '5px' }}>TOTAL</td>
                <td style={{ textAlign: 'right', padding: '0 5px' }}>{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: '10px', fontSize: '12px', fontWeight: 'bold' }}>
            Amount in words: <span style={{ fontWeight: 'normal' }}>{numToWordsINR(grandTotal)}</span>
          </div>

          {/* Footer - Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
            
            {/* Center Company Seal in Footer */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <div 
                onDrop={(e) => handleDrop(e, 'seal')} 
                onDragOver={handleDragOver}
                style={{ width: '150px', height: '150px', border: (droppedAssets.seal || isGenerating) ? 'none' : '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '12px' }}
              >
                {droppedAssets.seal ? (
                  <img src={droppedAssets.seal + "?t=" + new Date().getTime()} alt="Seal" style={{ maxWidth: '100%', maxHeight: '100%', mixBlendMode: 'multiply' }} />
                ) : (
                  !isGenerating && 'Drop Company Seal Here'
                )}
              </div>
            </div>

            {/* Signature Right Aligned */}
            <div style={{ textAlign: 'center', width: '250px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>For {letterhead.name}</div>
              
              <div 
                onDrop={(e) => handleDrop(e, 'sign')} 
                onDragOver={handleDragOver}
                style={{ height: '80px', border: (droppedAssets.sign || isGenerating) ? 'none' : '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '12px', margin: '0 auto 10px' }}
              >
                {droppedAssets.sign ? (
                  <img src={droppedAssets.sign + "?t=" + new Date().getTime()} alt="Signature" style={{ maxWidth: '100%', maxHeight: '100%', mixBlendMode: 'multiply' }} />
                ) : (
                  !isGenerating && 'Drop Signature Here'
                )}
              </div>
              
              <div style={{ fontSize: '12px', color: '#666' }}>Authorized Signatory</div>
            </div>

          </div>

        </div>
      </div>

      {/* Side Menu */}
      {!isGenerating && (
        <div className="glass-panel" style={{ width: '250px', height: '100%', overflowY: 'auto' }}>
          <h3 style={{ marginTop: 0, color: 'var(--accent)' }}>Assets Library</h3>
          <p style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>Drag and drop images onto the designated areas in the invoice.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {availableAssets.map(asset => (
              <div key={asset.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>{asset.name}</h4>
                <div 
                  draggable 
                  onDragStart={(e) => handleDragStart(e, asset)}
                  style={{ 
                    cursor: 'grab', 
                    display: 'flex', 
                    justifyContent: 'center',
                    background: 'white',
                    padding: '5px',
                    borderRadius: '4px'
                  }}
                >
                  <img src={asset.src + "?t=" + new Date().getTime()} alt={asset.name} style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
