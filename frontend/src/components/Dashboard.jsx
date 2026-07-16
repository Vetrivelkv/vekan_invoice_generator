import { NavLink, Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Building2,
  FilePlus2,
  Files,
  Flame,
  LogOut,
  Settings2,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { clearSession } from '../store/authSlice';
import { apiFetch } from '../api';
import InvoiceEditor from './InvoiceEditor';
import ViewInvoices from './ViewInvoices';
import Companies from './Companies';
import AppSettings from './AppSettings';
import Users from './Users';

const navClass = ({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`;

export default function Dashboard() {
  const dispatch = useDispatch();
  const { user, isAdmin } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST', sessionAware: false }).catch(() => {});
    localStorage.removeItem('vekanSessionExpiresAt');
    dispatch(clearSession());
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand-lockup">
          <span className="brand-mark"><Flame size={22} strokeWidth={2.4} /></span>
          <span><strong>Vekan Tech</strong><small>Fire & Safety Services</small></span>
        </div>

        <div className="sidebar-status"><ShieldCheck size={18} /><span>Protection operations</span></div>

        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          <span className="nav-section-label">Workspace</span>
          <NavLink to="/dashboard" end className={navClass}><Files size={18} />Invoices</NavLink>
          <NavLink to="/dashboard/create" className={navClass}><FilePlus2 size={18} />Create invoice</NavLink>
          <NavLink to="/dashboard/companies" className={navClass}><Building2 size={18} />Companies</NavLink>
          {isAdmin && <NavLink to="/dashboard/users" className={navClass}><UsersRound size={18} />Users</NavLink>}
          {isAdmin && <NavLink to="/dashboard/settings" className={navClass}><Settings2 size={18} />App settings</NavLink>}
          {isAdmin && <NavLink to="/dashboard/admin" className={navClass}><ShieldCheck size={18} />Admin approvals</NavLink>}
        </nav>

        <div className="sidebar-profile">
          <span className="profile-avatar">{(user.full_name || user.email).charAt(0).toUpperCase()}</span>
          <span className="profile-copy"><strong>{user.full_name || user.email}</strong><small>{user.role.replace('_', ' ')}</small></span>
          <button type="button" className="icon-button" onClick={handleLogout} aria-label="Log out" title="Log out"><LogOut size={18} /></button>
        </div>
      </aside>

      <main className="dashboard-shell">
        <header className="dashboard-topbar">
          <div><span className="eyebrow">Vekan operations</span><strong>Fire protection, clearly documented.</strong></div>
          <div className="service-pills"><span>Sprinklers</span><span>Hydrants</span><span>Hoses</span></div>
        </header>
        <div className="main-content">
          <Routes>
            <Route path="/" element={<ViewInvoices />} />
            <Route path="/create" element={<InvoiceEditor />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/users" element={isAdmin ? <Users /> : <div className="glass-panel"><h2>Access denied</h2></div>} />
            <Route path="/settings" element={isAdmin ? <AppSettings /> : <div className="glass-panel"><h2>Access denied</h2></div>} />
            <Route path="/admin" element={<div className="glass-panel"><span className="eyebrow">Administration</span><h2>Admin approvals</h2><p>Pending user approvals will appear here.</p></div>} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
