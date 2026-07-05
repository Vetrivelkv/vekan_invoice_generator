import { Routes, Route, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import InvoiceEditor from './InvoiceEditor';
import ViewInvoices from './ViewInvoices';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { user, isAdmin } = useSelector(state => state.auth);

  return (
    <div className="app-container">
      <div className="sidebar">
        <h2 style={{ color: 'var(--accent)', marginBottom: '30px' }}>Vekan Tech</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>View Invoices</Link>
          <Link to="/dashboard/create" style={{ color: 'white', textDecoration: 'none' }}>Create Invoice</Link>
          <Link to="/dashboard/edit" style={{ color: 'white', textDecoration: 'none' }}>Edit Invoice</Link>
          <Link to="/dashboard/delete" style={{ color: 'white', textDecoration: 'none' }}>Delete Invoice</Link>
          {isAdmin && (
            <Link to="/dashboard/admin" style={{ color: 'var(--accent)', textDecoration: 'none', marginTop: '20px' }}>
              Admin Approvals
            </Link>
          )}
        </nav>
        <div style={{ position: 'absolute', bottom: '20px' }}>
          <p style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>{user.email}</p>
          <button className="btn-primary" onClick={() => dispatch(logout())} style={{ padding: '5px 10px', fontSize: '0.9em' }}>
            Logout
          </button>
        </div>
      </div>
      <div className="main-content">
        <Routes>
          <Route path="/" element={<ViewInvoices />} />
          <Route path="/create" element={<InvoiceEditor />} />
          <Route path="/edit" element={<div className="glass-panel"><h2>Edit Invoice</h2></div>} />
          <Route path="/delete" element={<div className="glass-panel"><h2>Delete Invoice</h2></div>} />
          <Route path="/admin" element={<div className="glass-panel"><h2>Admin Dashboard</h2><p>Pending user approvals...</p></div>} />
        </Routes>
      </div>
    </div>
  );
}
