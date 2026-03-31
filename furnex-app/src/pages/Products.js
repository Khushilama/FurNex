import React, { useEffect, useState } from 'react';
import { api } from '../api/api';

const Rs = (n) => `Rs ${Number(n).toLocaleString('en-IN')}`;

const EMPTY = { name: '', category: '', description: '', sellingPrice: '', productionCost: '', status: 'Available' };

const STATUSES = ['Available', 'Out of Stock', 'Discontinued'];

const CAT_COLORS = {
  Tables:  { bg: '#fff3e0', color: '#e67e22' },
  Storage: { bg: '#e3f0fb', color: '#2980b9' },
  Beds:    { bg: '#f3e5f5', color: '#8e44ad' },
  Sofas:   { bg: '#e8f8f0', color: '#27ae60' },
  Chairs:  { bg: '#fde8e8', color: '#e74c3c' },
  Other:   { bg: '#f0f0f0', color: '#555' },
};
const getCatStyle = (cat) => CAT_COLORS[cat] || { bg: '#f0f2f5', color: '#555' };

export default function Products() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const load = () => api.getCatalog().then(r => setItems(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name || !form.sellingPrice) return;
    if (editing) {
      await api.updateCatalogItem(editing, form);
      setEditing(null);
    } else {
      await api.addCatalogItem(form);
    }
    setForm(EMPTY);
    setShowForm(false);
    load();
  };

  const startEdit = (item) => {
    setForm({ ...item });
    setEditing(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await api.deleteCatalogItem(id);
    load();
  };

  const categories = ['All', ...new Set(items.map(p => p.category).filter(Boolean))];
  const uniqueCats = [...new Set(items.map(p => p.category).filter(Boolean))];

  const filtered = items.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'All' || p.category === filterCat;
    const matchStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const totalProducts = items.length;
  const available = items.filter(p => p.status === 'Available').length;
  const avgMargin = items.length > 0
    ? (items.reduce((s, p) => {
        const margin = p.sellingPrice > 0 ? ((p.sellingPrice - p.productionCost) / p.sellingPrice) * 100 : 0;
        return s + margin;
      }, 0) / items.length).toFixed(1)
    : 0;
  const totalCatalogValue = items.reduce((s, p) => s + Number(p.sellingPrice), 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Products</div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
        <div className="stat-card" style={{ borderTop: '3px solid #2980b9' }}>
          <div className="stat-label">Total Products</div>
          <div className="stat-value" style={{ color: '#2980b9' }}>{totalProducts}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #27ae60' }}>
          <div className="stat-label">Available</div>
          <div className="stat-value" style={{ color: '#27ae60' }}>{available}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #f5a623' }}>
          <div className="stat-label">Avg Profit Margin</div>
          <div className="stat-value" style={{ color: '#f5a623', fontSize: 24 }}>{avgMargin}%</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #8e44ad' }}>
          <div className="stat-label">Categories</div>
          <div className="stat-value" style={{ color: '#8e44ad' }}>{uniqueCats.length}</div>
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {categories.map(cat => {
          const count = cat === 'All' ? items.length : items.filter(p => p.category === cat).length;
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
          <div className="section-title">{editing ? 'Edit Product' : 'Add Product'}</div>
          <div className="form-row">
            <div className="form-group">
              <label>Product Name</label>
              <input placeholder="e.g. Dining Table" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input placeholder="e.g. Tables" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} list="pcat-list" />
              <datalist id="pcat-list">
                {uniqueCats.map(c => <option key={c} value={c} />)}
                <option value="Tables" /><option value="Storage" /><option value="Beds" />
                <option value="Sofas" /><option value="Chairs" /><option value="Other" />
              </datalist>
            </div>
            <div className="form-group">
              <label>Selling Price (Rs)</label>
              <input type="number" placeholder="0" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Production Cost (Rs)</label>
              <input type="number" placeholder="0" value={form.productionCost} onChange={e => setForm({ ...form, productionCost: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label>Description</label>
              <input placeholder="Short description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-orange" onClick={save}>{editing ? 'Update Product' : 'Add Product'}</button>
            <button className="btn" style={{ background: '#eee', color: '#555' }} onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>Product Catalog</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, width: 180, outline: 'none' }}
            />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, outline: 'none' }}>
              <option value="All">All Status</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <button className="btn btn-orange" onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY); }}>
              + Add Product
            </button>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Description</th>
              <th>Selling Price</th>
              <th>Production Cost</th>
              <th>Profit</th>
              <th>Margin</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: '#aaa', padding: 30 }}>
                  {search ? 'No products match your search.' : 'No products yet. Click + Add Product.'}
                </td>
              </tr>
            )}
            {filtered.map(p => {
              const profit = Number(p.sellingPrice) - Number(p.productionCost);
              const margin = p.sellingPrice > 0 ? ((profit / p.sellingPrice) * 100).toFixed(1) : 0;
              const catStyle = getCatStyle(p.category);
              const statusStyle = {
                Available:    { bg: '#e8f8f0', color: '#27ae60' },
                'Out of Stock': { bg: '#fde8e8', color: '#e74c3c' },
                Discontinued: { bg: '#f0f0f0', color: '#888' },
              }[p.status] || { bg: '#f0f0f0', color: '#888' };

              return (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td>
                    <span style={{ background: catStyle.bg, color: catStyle.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {p.category || '—'}
                    </span>
                  </td>
                  <td style={{ color: '#888', fontSize: 13 }}>{p.description || '—'}</td>
                  <td style={{ fontWeight: 700, color: '#1a1a2e' }}>{Rs(p.sellingPrice)}</td>
                  <td style={{ color: '#e74c3c' }}>{Rs(p.productionCost)}</td>
                  <td style={{ fontWeight: 700, color: profit >= 0 ? '#27ae60' : '#e74c3c' }}>{Rs(profit)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 50, background: '#eee', borderRadius: 4, height: 6 }}>
                        <div style={{ width: `${Math.min(100, Math.max(0, margin))}%`, height: 6, borderRadius: 4, background: margin >= 30 ? '#27ae60' : margin >= 15 ? '#f5a623' : '#e74c3c' }} />
                      </div>
                      <span style={{ fontSize: 12, color: '#555' }}>{margin}%</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {p.status}
                    </span>
                  </td>
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
              <tr style={{ background: '#f7f8fa', fontWeight: 700 }}>
                <td colSpan={3} style={{ padding: '10px 12px', color: '#555' }}>{filtered.length} products</td>
                <td style={{ color: '#1a1a2e', padding: '10px 12px' }}>{Rs(filtered.reduce((s, p) => s + Number(p.sellingPrice), 0))}</td>
                <td style={{ color: '#e74c3c', padding: '10px 12px' }}>{Rs(filtered.reduce((s, p) => s + Number(p.productionCost), 0))}</td>
                <td style={{ color: '#27ae60', padding: '10px 12px' }}>{Rs(filtered.reduce((s, p) => s + (Number(p.sellingPrice) - Number(p.productionCost)), 0))}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
