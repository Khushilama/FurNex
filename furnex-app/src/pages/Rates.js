import React, { useEffect, useState } from 'react';
import { api } from '../api/api';

const Rs = (n) => `Rs ${Number(n).toLocaleString('en-IN')}`;

const EMPTY = { name: '', category: '', ratePerUnit: '', unit: 'per piece', description: '' };

export default function Rates() {
  const [rates, setRates] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => api.getRates().then(r => setRates(r.data)).catch(() => {});

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name || !form.ratePerUnit) return;
    if (editing) {
      await api.updateRate(editing, form);
      setEditing(null);
    } else {
      await api.addRate(form);
    }
    setForm(EMPTY);
    setShowForm(false);
    load();
  };

  const startEdit = (r) => {
    setForm({ ...r });
    setEditing(r.id);
    setShowForm(true);
  };

  const remove = async (id) => {
    await api.deleteRate(id);
    load();
  };

  const categories = [...new Set(rates.map(r => r.category).filter(Boolean))];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Rates & Pricing</div>
        <button className="btn btn-orange" onClick={() => { setShowForm(!showForm); setEditing(null); setForm(EMPTY); }}>
          + Add Rate
        </button>
      </div>

      {showForm && (
        <div className="section-card">
          <div className="section-title">{editing ? 'Edit Rate' : 'Add Rate'}</div>
          <div className="form-row">
            <div className="form-group">
              <label>Item / Service Name</label>
              <input placeholder="e.g. Dining Table" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input placeholder="e.g. Furniture" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Rate (Rs)</label>
              <input type="number" placeholder="0" value={form.ratePerUnit} onChange={e => setForm({ ...form, ratePerUnit: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                <option>per piece</option>
                <option>per sq.ft</option>
                <option>per meter</option>
                <option>per day</option>
                <option>per hour</option>
                <option>per kg</option>
              </select>
            </div>
            <div className="form-group">
              <label>Description</label>
              <input placeholder="Optional notes" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={save}>
              {editing ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="section-card">
          <div className="section-title">All Rates</div>
          <RatesTable rates={rates} onEdit={startEdit} onDelete={remove} />
        </div>
      ) : (
        categories.map(cat => (
          <div className="section-card" key={cat}>
            <div className="section-title">{cat}</div>
            <RatesTable rates={rates.filter(r => r.category === cat)} onEdit={startEdit} onDelete={remove} />
          </div>
        ))
      )}

      {rates.filter(r => !r.category).length > 0 && (
        <div className="section-card">
          <div className="section-title">Uncategorized</div>
          <RatesTable rates={rates.filter(r => !r.category)} onEdit={startEdit} onDelete={remove} />
        </div>
      )}
    </div>
  );
}

function RatesTable({ rates, onEdit, onDelete }) {
  if (rates.length === 0) {
    return <p style={{ color: '#aaa', fontSize: 14, padding: '10px 0' }}>No rates yet. Add one above.</p>;
  }
  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Rate</th>
          <th>Unit</th>
          <th>Description</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rates.map((r, i) => (
          <tr key={r.id}>
            <td>{i + 1}</td>
            <td><strong>{r.name}</strong></td>
            <td style={{ color: '#27ae60', fontWeight: 700 }}>{`Rs ${Number(r.ratePerUnit).toLocaleString('en-IN')}`}</td>
            <td><span className="badge production">{r.unit}</span></td>
            <td style={{ color: '#888' }}>{r.description || '—'}</td>
            <td>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-sm btn-primary" onClick={() => onEdit(r)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(r.id)}>Del</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
