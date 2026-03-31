import React, { useEffect, useState } from 'react';
import { api } from '../api/api';

const EMPTY = { name: '', phone: '', email: '', address: '', notes: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const load = () => {
    api.getCustomers().then(r => setCustomers(r.data)).catch(() => {});
    api.getOrders().then(r => setOrders(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name) return;
    if (editing) {
      await api.updateCustomer(editing, form);
      setEditing(null);
    } else {
      await api.addCustomer(form);
    }
    setForm(EMPTY);
    setShowForm(false);
    load();
  };

  const startEdit = (c) => {
    setForm({ ...c });
    setEditing(c.id);
    setShowForm(true);
    setSelected(null);
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this customer? Their orders will remain but be unlinked.')) return;
    await api.deleteCustomer(id);
    if (selected?.id === id) setSelected(null);
    load();
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const getCustomerOrders = (id) => orders.filter(o => o.customerId === id);
  const totalRevenue = (id) => getCustomerOrders(id).filter(o => o.status === 'Delivered').reduce((s, o) => s + Number(o.amount), 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Customers</div>
        <button className="btn btn-orange" onClick={() => { setShowForm(!showForm); setEditing(null); setForm(EMPTY); setSelected(null); }}>
          + Add Customer
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="stat-card" style={{ borderTop: '3px solid #2980b9' }}>
          <div className="stat-label">Total Customers</div>
          <div className="stat-value" style={{ color: '#2980b9' }}>{customers.length}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #27ae60' }}>
          <div className="stat-label">Total Orders</div>
          <div className="stat-value" style={{ color: '#27ae60' }}>{orders.filter(o => o.customerId).length}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #f5a623' }}>
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value" style={{ color: '#f5a623', fontSize: 20 }}>
            Rs {orders.filter(o => o.customerId && o.status === 'Delivered').reduce((s, o) => s + Number(o.amount), 0).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="section-card" style={{ marginBottom: 20, borderTop: '3px solid #f5a623' }}>
          <div className="section-title">{editing ? 'Edit Customer' : 'Add Customer'}</div>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input placeholder="Customer name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input placeholder="email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label>Address</label>
              <input placeholder="Full address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label>Notes</label>
              <input placeholder="Optional notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-orange" onClick={save}>{editing ? 'Update' : 'Add Customer'}</button>
            <button className="btn" style={{ background: '#eee', color: '#555' }} onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY); }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="dash-two-col" style={{ alignItems: 'flex-start' }}>
        {/* Customer List */}
        <div className="section-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>Customer List</div>
            <input
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, width: 180, outline: 'none' }}
            />
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Revenue</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>No customers yet.</td></tr>}
              {filtered.map(c => (
                <tr key={c.id} style={{ cursor: 'pointer', background: selected?.id === c.id ? '#fff8f0' : '' }} onClick={() => setSelected(c)}>
                  <td>
                    <strong>{c.name}</strong>
                    {c.email && <div style={{ fontSize: 11, color: '#aaa' }}>{c.email}</div>}
                  </td>
                  <td style={{ color: '#555' }}>{c.phone || '—'}</td>
                  <td><span className="badge production">{getCustomerOrders(c.id).length}</span></td>
                  <td style={{ color: '#27ae60', fontWeight: 600 }}>Rs {totalRevenue(c.id).toLocaleString('en-IN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-sm" style={{ background: '#e3f0fb', color: '#2980b9', fontWeight: 600 }} onClick={() => startEdit(c)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(c.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Customer Detail */}
        <div className="section-card" style={{ minHeight: 200 }}>
          {!selected ? (
            <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>
              <div style={{ fontSize: 32 }}>👆</div>
              <div style={{ marginTop: 8, fontSize: 14 }}>Click a customer to see their order history</div>
            </div>
          ) : (
            <>
              <div className="section-title">{selected.name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, fontSize: 13 }}>
                {selected.phone && <div><span style={{ color: '#888' }}>Phone:</span> {selected.phone}</div>}
                {selected.email && <div><span style={{ color: '#888' }}>Email:</span> {selected.email}</div>}
                {selected.address && <div style={{ gridColumn: '1/-1' }}><span style={{ color: '#888' }}>Address:</span> {selected.address}</div>}
                {selected.notes && <div style={{ gridColumn: '1/-1' }}><span style={{ color: '#888' }}>Notes:</span> {selected.notes}</div>}
                <div><span style={{ color: '#888' }}>Customer since:</span> {selected.createdAt}</div>
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 10 }}>Order History</div>
              {getCustomerOrders(selected.id).length === 0 ? (
                <p style={{ color: '#aaa', fontSize: 13 }}>No orders linked to this customer yet.</p>
              ) : (
                <table>
                  <thead>
                    <tr><th>Item</th><th>Amount</th><th>Date</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {getCustomerOrders(selected.id).map(o => (
                      <tr key={o.id}>
                        <td>{o.item}</td>
                        <td style={{ color: '#27ae60', fontWeight: 600 }}>Rs {Number(o.amount).toLocaleString('en-IN')}</td>
                        <td>{new Date(o.date + 'T00:00:00').toLocaleDateString('en-IN')}</td>
                        <td><span className={`badge ${o.status === 'Pending' ? 'pending' : o.status === 'In Production' ? 'production' : 'delivered'}`}>{o.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
