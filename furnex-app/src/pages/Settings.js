import React, { useEffect, useState } from 'react';
import { api } from '../api/api';

const user = () => {
  try { return JSON.parse(localStorage.getItem('furnex_user') || '{}'); } catch { return {}; }
};

const FIELD_DEFS = [
  { key: 'businessName',    label: 'Business Name',    type: 'text' },
  { key: 'businessAddress', label: 'Business Address', type: 'text' },
  { key: 'businessPhone',   label: 'Phone',            type: 'text' },
  { key: 'businessEmail',   label: 'Email',            type: 'email' },
  { key: 'businessGST',     label: 'GST Number',       type: 'text' },
  { key: 'invoicePrefix',   label: 'Invoice Prefix',   type: 'text' },
];

export default function Settings() {
  const [form, setForm]       = useState({});
  const [saved, setSaved]     = useState(false);
  const [loading, setLoading] = useState(true);

  // Users
  const [users, setUsers]           = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editUser, setEditUser]     = useState(null);
  const [userForm, setUserForm]     = useState({ username: '', password: '', name: '', role: 'staff' });
  const [userError, setUserError]   = useState('');
  const currentUser = user();

  const loadSettings = () =>
    api.getSettings().then(r => { setForm(r.data); setLoading(false); }).catch(() => setLoading(false));

  const loadUsers = () =>
    api.getUsers().then(r => setUsers(r.data)).catch(() => {});

  useEffect(() => { loadSettings(); loadUsers(); }, []);

  const saveSettings = async () => {
    await api.updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const openAddUser = () => {
    setEditUser(null);
    setUserForm({ username: '', password: '', name: '', role: 'staff' });
    setUserError('');
    setShowUserForm(true);
  };

  const openEditUser = (u) => {
    setEditUser(u);
    setUserForm({ username: u.username, password: '', name: u.name, role: u.role });
    setUserError('');
    setShowUserForm(true);
  };

  const saveUser = async () => {
    setUserError('');
    if (!editUser && (!userForm.username || !userForm.password)) {
      return setUserError('Username and password are required');
    }
    try {
      if (editUser) {
        const payload = { name: userForm.name, role: userForm.role };
        if (userForm.password) payload.password = userForm.password;
        await api.updateUser(editUser.id, payload);
      } else {
        await api.addUser(userForm);
      }
      setShowUserForm(false);
      loadUsers();
    } catch (err) {
      setUserError(err.response?.data?.message || 'Failed to save user');
    }
  };

  const deleteUser = async (u) => {
    if (u.id === currentUser.id) return alert('Cannot delete your own account');
    if (!window.confirm(`Delete user "${u.username}"?`)) return;
    await api.deleteUser(u.id);
    loadUsers();
  };

  if (loading) return <div style={{ padding: 40, color: '#888' }}>Loading settings…</div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Settings</div>
      </div>

      {/* Business Info */}
      <div className="section-card" style={{ marginBottom: 24 }}>
        <div className="section-title">Business Information</div>
        <div className="form-row">
          {FIELD_DEFS.map(({ key, label, type }) => (
            <div className="form-group" key={key}>
              <label>{label}</label>
              <input
                type={type}
                value={form[key] || ''}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                placeholder={label}
              />
            </div>
          ))}
        </div>

        {/* GST Rates */}
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 10 }}>GST Rates</div>
          <div className="form-row">
            <div className="form-group" style={{ maxWidth: 160 }}>
              <label>CGST Rate (%)</label>
              <input
                type="number" min="0" max="50" step="0.5"
                value={form.cgstRate ?? ''}
                onChange={e => setForm({ ...form, cgstRate: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ maxWidth: 160 }}>
              <label>SGST Rate (%)</label>
              <input
                type="number" min="0" max="50" step="0.5"
                value={form.sgstRate ?? ''}
                onChange={e => setForm({ ...form, sgstRate: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ maxWidth: 140 }}>
              <label>Currency Symbol</label>
              <input
                value={form.currency || ''}
                onChange={e => setForm({ ...form, currency: e.target.value })}
                placeholder="Rs"
              />
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
            Total GST = CGST + SGST. Current total: {(Number(form.cgstRate || 0) + Number(form.sgstRate || 0)).toFixed(1)}%
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn btn-orange" onClick={saveSettings}>Save Settings</button>
          {saved && <span style={{ color: '#27ae60', fontWeight: 600, fontSize: 13 }}>✓ Saved successfully!</span>}
        </div>
      </div>

      {/* User Management */}
      <div className="section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>User Management</div>
          <button className="btn btn-orange" onClick={openAddUser}>+ Add User</button>
        </div>

        {showUserForm && (
          <div style={{
            background: '#f9f9f9', border: '1.5px solid #f5a623', borderRadius: 10,
            padding: '20px 24px', marginBottom: 20
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 14 }}>
              {editUser ? `Edit User: ${editUser.username}` : 'New User'}
            </div>
            <div className="form-row">
              {!editUser && (
                <div className="form-group">
                  <label>Username</label>
                  <input
                    value={userForm.username}
                    onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                    placeholder="e.g. john"
                    autoComplete="off"
                  />
                </div>
              )}
              <div className="form-group">
                <label>Full Name</label>
                <input
                  value={userForm.name}
                  onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Display name"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div className="form-group">
                <label>{editUser ? 'New Password (leave blank to keep)' : 'Password'}</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder={editUser ? 'Leave blank to keep current' : 'Min 6 characters'}
                  autoComplete="new-password"
                />
              </div>
            </div>
            {userError && (
              <div style={{ background: '#fde8e8', color: '#e74c3c', borderRadius: 8, padding: '8px 14px', fontSize: 13, marginBottom: 12 }}>
                {userError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-orange" onClick={saveUser}>
                {editUser ? 'Update User' : 'Create User'}
              </button>
              <button className="btn" style={{ background: '#eee', color: '#555' }} onClick={() => setShowUserForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: '#aaa', padding: 24 }}>No users found.</td></tr>
            )}
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <strong>{u.username}</strong>
                  {u.id === currentUser.id && (
                    <span style={{ marginLeft: 8, fontSize: 11, background: '#e3f0fb', color: '#2980b9', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>You</span>
                  )}
                </td>
                <td>{u.name}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'present' : 'production'}`} style={{ textTransform: 'capitalize' }}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm" style={{ background: '#e3f0fb', color: '#2980b9', fontWeight: 600 }} onClick={() => openEditUser(u)}>Edit</button>
                    {u.id !== currentUser.id && (
                      <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u)}>Del</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
