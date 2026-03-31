import React, { useEffect, useState } from 'react';
import { api } from '../api/api';

const Rs = (n) => `Rs ${Number(n).toLocaleString('en-IN')}`;

const EMPTY = { name: '', category: '', quantity: '', unit: 'pcs', minStock: '', costPerUnit: '', usedQty: 0 };

const CATEGORY_COLORS = {
  Wood:      { bg: '#fff3e0', color: '#e67e22' },
  Hardware:  { bg: '#e3f0fb', color: '#2980b9' },
  Fabric:    { bg: '#f3e5f5', color: '#8e44ad' },
  Finish:    { bg: '#e8f8f0', color: '#27ae60' },
  Finishing: { bg: '#e8f8f0', color: '#27ae60' },
  Other:     { bg: '#f0f0f0', color: '#555' },
};
const getCatStyle = (cat) => CATEGORY_COLORS[cat] || { bg: '#f0f0f0', color: '#555' };

const UNITS = ['pcs', 'kg', 'meters', 'liters', 'sheets', 'm²', 'L', 'boxes'];

export default function Materials() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');

  const load = () => api.getProducts().then(r => setProducts(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name || !form.quantity || !form.costPerUnit) return;
    if (editing) {
      await api.updateProduct(editing, form);
      setEditing(null);
    } else {
      await api.addProduct(form);
    }
    setForm(EMPTY);
    setShowForm(false);
    load();
  };

  const startEdit = (p) => {
    setForm({ ...p });
    setEditing(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    await api.deleteProduct(id);
    load();
  };

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
  const uniqueCats = [...new Set(products.map(p => p.category).filter(Boolean))];
  const lowStock = products.filter(p => Number(p.quantity) <= Number(p.minStock)).length;
  const totalValue = products.reduce((s, p) => s + Number(p.costPerUnit) * Number(p.quantity), 0);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'All' || p.category === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Materials</div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
        <div className="stat-card" style={{ borderTop: '3px solid #2980b9' }}>
          <div className="stat-label">Total Materials</div>
          <div className="stat-value" style={{ color: '#2980b9' }}>{products.length}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #e74c3c' }}>
          <div className="stat-label">Low Stock Alerts</div>
          <div className="stat-value" style={{ color: lowStock > 0 ? '#e74c3c' : '#27ae60' }}>{lowStock}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #27ae60' }}>
          <div className="stat-label">Stock Value</div>
          <div className="stat-value" style={{ color: '#27ae60', fontSize: 22 }}>{Rs(totalValue)}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #8e44ad' }}>
          <div className="stat-label">Categories</div>
          <div className="stat-value" style={{ color: '#8e44ad' }}>{uniqueCats.length}</div>
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {categories.map(cat => {
          const count = cat === 'All' ? products.length : products.filter(p => p.category === cat).length;
          const style = cat !== 'All' ? getCatStyle(cat) : { bg: '#1a1a2e', color: '#fff' };
          const isActive = filterCat === cat;
          return (
            <button key={cat} onClick={() => setFilterCat(cat)} style={{
              padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
              background: isActive ? style.bg : '#f0f0f0',
              color: isActive ? style.color : '#666',
              boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            }}>
              {cat} · {count}
            </button>
          );
        })}
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="section-card" style={{ marginBottom: 20, borderTop: '3px solid #f5a623' }}>
          <div className="section-title">{editing ? 'Edit Material' : 'Add Material'}</div>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input placeholder="e.g. Teak Wood" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input placeholder="e.g. Wood" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} list="cat-list" />
              <datalist id="cat-list">
                {uniqueCats.map(c => <option key={c} value={c} />)}
                <option value="Wood" /><option value="Hardware" /><option value="Fabric" />
                <option value="Finishing" /><option value="Other" />
              </datalist>
            </div>
            <div className="form-group">
              <label>Stock Qty</label>
              <input type="number" placeholder="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Min Stock</label>
              <input type="number" placeholder="5" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Cost / Unit (Rs)</label>
              <input type="number" placeholder="0" value={form.costPerUnit} onChange={e => setForm({ ...form, costPerUnit: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Used Qty</label>
              <input type="number" placeholder="0" value={form.usedQty} onChange={e => setForm({ ...form, usedQty: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-orange" onClick={save}>{editing ? 'Update Material' : 'Add Material'}</button>
            <button className="btn" style={{ background: '#eee', color: '#555' }} onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>Material Inventory</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              placeholder="Search materials..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, width: 180, outline: 'none' }}
            />
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, outline: 'none' }}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
            <button className="btn btn-orange" onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY); }}>
              + Add Material
            </button>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Material</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Stock</th>
              <th>Min Stock</th>
              <th>Cost/Unit</th>
              <th>Total Value</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: '#aaa', padding: 30 }}>
                  {search ? 'No materials match your search.' : 'No materials yet. Click + Add Material.'}
                </td>
              </tr>
            )}
            {filtered.map(p => {
              const isLow = Number(p.quantity) <= Number(p.minStock);
              const catStyle = getCatStyle(p.category);
              return (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td>
                    <span style={{ background: catStyle.bg, color: catStyle.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {p.category || '—'}
                    </span>
                  </td>
                  <td style={{ color: '#666' }}>{p.unit}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ color: isLow ? '#e74c3c' : '#222' }}>{p.quantity}</strong>
                      <div style={{ width: 50, background: '#eee', borderRadius: 4, height: 5 }}>
                        <div style={{
                          width: `${Math.min(100, (Number(p.quantity) / (Number(p.minStock) * 3 || 1)) * 100)}%`,
                          height: 5, borderRadius: 4, background: isLow ? '#e74c3c' : '#27ae60'
                        }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#888' }}>{p.minStock}</td>
                  <td>Rs {Number(p.costPerUnit).toLocaleString('en-IN')}</td>
                  <td style={{ color: '#27ae60', fontWeight: 700 }}>{Rs(Number(p.costPerUnit) * Number(p.quantity))}</td>
                  <td><span className={`badge ${isLow ? 'low' : 'ok'}`}>{isLow ? 'Low' : 'OK'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" style={{ background: '#e3f0fb', color: '#2980b9', fontWeight: 600 }} onClick={() => startEdit(p)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(p.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr style={{ background: '#f7f8fa' }}>
                <td colSpan={6} style={{ fontWeight: 600, color: '#555', padding: '10px 12px' }}>
                  {filtered.length} material{filtered.length !== 1 ? 's' : ''}
                </td>
                <td style={{ fontWeight: 700, color: '#27ae60', padding: '10px 12px' }}>
                  {Rs(filtered.reduce((s, p) => s + Number(p.costPerUnit) * Number(p.quantity), 0))}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
