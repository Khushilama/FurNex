import React, { useState, useRef, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Materials from './pages/Materials';
import Products from './pages/Products';
import SalesOrders from './pages/SalesOrders';
import Rates from './pages/Rates';
import ProfitLoss from './pages/ProfitLoss';
import Customers from './pages/Customers';
import Payroll from './pages/Payroll';
import Settings from './pages/Settings';
import Quotations from './pages/Quotations';
import Expenses from './pages/Expenses';
import Login from './pages/Login';
import { authApi } from './api/api';
import './App.css';

const TABS = ['Dashboard', 'Attendance', 'Payroll', 'Materials', 'Products', 'Customers', 'Sales & Orders', 'Quotations', 'Expenses', 'Rates', 'Profit & Loss', 'Settings'];

// ── Change Password Modal ─────────────────────────────────────────────────────
function ChangePasswordModal({ user, onClose }) {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.newPassword !== form.confirmPassword) return setError('New passwords do not match');
    if (form.newPassword.length < 6) return setError('New password must be at least 6 characters');
    setLoading(true);
    try {
      await authApi.changePassword({ username: user.username, oldPassword: form.oldPassword, newPassword: form.newPassword });
      setSuccess('Password changed successfully!');
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: '32px 28px',
        width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Change Password</h2>
            <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>Logged in as <strong>{user.username}</strong></p>
          </div>
          <button onClick={onClose} style={{
            background: '#f0f0f0', border: 'none', borderRadius: '50%',
            width: 30, height: 30, cursor: 'pointer', fontSize: 16, color: '#555'
          }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {[
            { key: 'oldPassword', label: 'Current Password', placeholder: 'Enter current password' },
            { key: 'newPassword', label: 'New Password', placeholder: 'Min 6 characters' },
            { key: 'confirmPassword', label: 'Confirm New Password', placeholder: 'Re-enter new password' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>{label}</label>
              <input
                type="password"
                placeholder={placeholder}
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                style={{
                  width: '100%', padding: '10px 12px', border: '1.5px solid #e0e0e0',
                  borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
          ))}

          {error && (
            <div style={{ background: '#fde8e8', color: '#e74c3c', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: '#e8f8f0', color: '#27ae60', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>
              {success}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="submit" disabled={loading} style={{
              flex: 1, padding: '11px', background: '#f5a623', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer'
            }}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
            <button type="button" onClick={onClose} style={{
              padding: '11px 18px', background: '#f0f0f0', color: '#555',
              border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer'
            }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── User Dropdown ─────────────────────────────────────────────────────────────
function UserDropdown({ user, onLogout, onChangePassword }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
        padding: '4px 8px', borderRadius: 8, transition: 'background 0.2s',
        background: open ? 'rgba(255,255,255,0.1)' : 'transparent',
      }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{user.name || user.username}</div>
          <div style={{ fontSize: 11, color: '#aaa', textTransform: 'capitalize' }}>{user.role}</div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: '#f5a623',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 16, color: '#fff', flexShrink: 0,
        }}>
          {(user.name || user.username)[0].toUpperCase()}
        </div>
        <span style={{ color: '#aaa', fontSize: 11 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)',
          background: '#fff', borderRadius: 10, minWidth: 200,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 999, overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>{user.name || user.username}</div>
            <div style={{ fontSize: 12, color: '#888', textTransform: 'capitalize', marginTop: 2 }}>{user.role}</div>
          </div>
          <div style={{ padding: '6px 0' }}>
            <DropdownItem icon="🔒" label="Change Password" onClick={() => { setOpen(false); onChangePassword(); }} />
            <div style={{ borderTop: '1px solid #f0f0f0', margin: '6px 0' }} />
            <DropdownItem icon="🚪" label="Logout" color="#e74c3c" onClick={() => { setOpen(false); onLogout(); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownItem({ icon, label, onClick, color }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px',
        cursor: 'pointer', fontSize: 13, color: color || '#333',
        background: hovered ? '#f7f8fa' : 'transparent', transition: 'background 0.15s',
      }}>
      <span>{icon}</span><span>{label}</span>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('furnex_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showChangePw, setShowChangePw] = useState(false);

  const handleLogin = (userData) => setUser(userData);

  const handleLogout = () => {
    localStorage.removeItem('furnex_token');
    localStorage.removeItem('furnex_user');
    setUser(null);
    setActiveTab('Dashboard');
  };

  if (!user) return <Login onLogin={handleLogin} />;

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="app">
      {showChangePw && (
        <ChangePasswordModal user={user} onClose={() => setShowChangePw(false)} />
      )}

      <header className="header">
        <div className="header-left">
          <h1 className="logo">FurNex</h1>
          <span className="subtitle">Workshop Management</span>
        </div>
        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span className="date">{today}</span>
          <UserDropdown user={user} onLogout={handleLogout} onChangePassword={() => setShowChangePw(true)} />
        </div>
      </header>

      <nav className="nav">
        {TABS.map(tab => (
          <button key={tab} className={`nav-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </nav>

      <main className="main">
        {activeTab === 'Dashboard' && <Dashboard />}
        {activeTab === 'Attendance' && <Attendance />}
        {activeTab === 'Payroll' && <Payroll />}
        {activeTab === 'Materials' && <Materials />}
        {activeTab === 'Products' && <Products />}
        {activeTab === 'Customers' && <Customers />}
        {activeTab === 'Sales & Orders' && <SalesOrders />}
        {activeTab === 'Quotations' && <Quotations />}
        {activeTab === 'Expenses' && <Expenses />}
        {activeTab === 'Rates' && <Rates />}
        {activeTab === 'Profit & Loss' && <ProfitLoss />}
        {activeTab === 'Settings' && <Settings />}
      </main>
    </div>
  );
}

export default App;
