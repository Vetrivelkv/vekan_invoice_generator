import { useEffect, useState } from 'react';
import { apiFetch } from '../api';

const emptyForm = { name: '', address: '', gst_number: '' };

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadCompanies = async () => {
    const response = await apiFetch('/api/companies');
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Unable to load companies');
    setCompanies(data.companies || []);
  };

  useEffect(() => {
    loadCompanies().catch((loadError) => setError(loadError.message));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      const response = await apiFetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Unable to save company');
      setCompanies((current) => [...current, data.company].sort((a, b) => a.name.localeCompare(b.name)));
      setForm(emptyForm);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const removeCompany = async (company) => {
    if (!window.confirm(`Remove ${company.name}?`)) return;
    const response = await apiFetch(`/api/companies/${company.id}`, { method: 'DELETE' });
    if (response.ok) setCompanies((current) => current.filter((item) => item.id !== company.id));
  };

  return (
    <div className="glass-panel" style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ color: 'var(--accent)', marginTop: 0 }}>Companies</h2>
      <p style={{ color: 'var(--text-muted)' }}>Add companies that can be selected in the invoice TO section.</p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px', margin: '24px 0' }}>
        <input className="input-field" placeholder="Company name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        <textarea className="input-field" placeholder="Company address" rows="3" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} required />
        <input className="input-field" placeholder="GST number" value={form.gst_number} onChange={(event) => setForm({ ...form, gst_number: event.target.value.toUpperCase() })} required />
        {error && <div style={{ color: 'var(--error)' }}>{error}</div>}
        <button className="btn-primary" type="submit" disabled={isSaving} style={{ justifySelf: 'start' }}>
          {isSaving ? 'Saving...' : 'Add Company'}
        </button>
      </form>

      <div style={{ display: 'grid', gap: '12px' }}>
        {companies.map((company) => (
          <div key={company.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
            <div>
              <strong>{company.name}</strong>
              <div style={{ color: 'var(--text-muted)', whiteSpace: 'pre-wrap', marginTop: '5px' }}>{company.address}</div>
              <div style={{ marginTop: '5px' }}>GSTIN: {company.gst_number}</div>
            </div>
            <button className="btn-secondary" type="button" onClick={() => removeCompany(company)} style={{ alignSelf: 'center' }}>Remove</button>
          </div>
        ))}
        {!companies.length && <div style={{ color: 'var(--text-muted)' }}>No companies added yet.</div>}
      </div>
    </div>
  );
}
