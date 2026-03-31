import React, { useEffect, useState } from 'react';
import { api } from '../api/api';

const Rs = (n) => `Rs ${Number(n).toLocaleString('en-IN')}`;
const today = () => new Date().toISOString().split('T')[0];

const CATEGORIES = ['Rent', 'Utilities', 'Transport', 'Office Supplies', 'Maintenance', 'Marketing', 'Meals', 'Tools & Equipment', 'Other'];

const CAT_COLORS = {
  Rent: '#e74c3c', Utilities: '#2980b9', Transport: '#f5a623',
  'Office Supplies': '#8e44ad', Maintenance: '#16a085', Marketing: '#d35400',
  Meals: '#27ae60', 'Tools & Equipment': '#2c3e50', Other: '#95a5a6',
};

const EMPTY_FORM = { description: '', category: 'Other', amount: '', date: today() };

export default function Expenses() {
  const [expenses, setExpenses]     = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [editId, setEditId]         = useState(null);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterCat, setFilterCat]   = useState('');
  const [search, setSearch]         = useState('');

  const load = () => api.getExpenses().then(r => setExpenses(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const filtered = expenses.filter(e => {
    if (filterMonth && !e.date?.startsWith(filterMonth)) return false;
    if (filterCat && e.category !== filterCat) return false;
    if (search && !e.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Category breakdown for filtered set
  const byCategory = CATEGORIES.map(cat => ({
    cat,
    total: filtered.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0),
  })).filter(x => x.total > 0).sort((a, b) => b.total - a.total);

  const grandTotal = filtered.reduce((s, e) => s + Number(e.amount), 0);

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (e) => {
    setEditId(e.id);
    setForm({ description: e.description, category: e.category, amount: e.amount, date: e.date });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.description || !form.amount) return;
    if (editId) {
      await api.updateExpense(editId, form);
    } else {
      await api.addExpense(form);
    }
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    await api.deleteExpense(id);
    load();
  };

  const currentMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const thisMonthTotal = expenses
    .filter(e => e.date?.startsWith(currentMonth()))
    .reduce((s, e) => s + Number(e.amount), 0);

  const lastMonthTotal = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const lm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return expenses.filter(e => e.date?.startsWith(lm)).reduce((s, e) => s + Number(e.amount), 0);
  })();

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Expenses</div>
        <button className="btn btn-orange" onClick={openAdd}>+ Add Expense</button>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
        <div className="stat-card" style={{ borderTop: '3px solid #e74c3c' }}>
          <div className="stat-label">This Month</div>
          <div className="stat-value" style={{ color: '#e74c3c', fontSize: 20 }}>{Rs(thisMonthTotal)}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #aaa' }}>
          <div className="stat-label">Last Month</div>
          <div className="stat-value" style={{ color: '#888', fontSize: 20 }}>{Rs(lastMonthTotal)}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #2980b9' }}>
          <div className="stat-label">Total Entries</div>
          <div className="stat-value" style={{ color: '#2980b9' }}>{expenses.length}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #f5a623' }}>
          <div className="stat-label">Showing Total</div>
          <div className="stat-value" style={{ color: '#f5a623', fontSize: 20 }}>{Rs(grandTotal)}</div>
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="section-card" style={{ marginBottom: 20 }}>
          <div className="section-title">{editId ? 'Edit Expense' : 'New Expense'}</div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 3 }}>
              <label>Description</label>
              <input
                placeholder="e.g. Electricity bill"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                autoFocus
              />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
              <label>Amount (Rs)</label>
              <input
                type="number" placeholder="0" min="0"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
              <label>Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-orange" onClick={save}>{editId ? 'Update' : 'Add Expense'}</button>
            <button className="btn" style={{ background: '#eee', color: '#555' }} onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

        {/* Main Table */}
        <div className="section-card">
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0, flex: 1 }}>
              All Expenses
            </div>
            <input
              placeholder="Search description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '7px 12px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, width: 200 }}
            />
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              style={{ padding: '7px 10px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13 }}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input
              type="month"
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              style={{ padding: '7px 10px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13 }}
            />
            {(filterMonth || filterCat || search) && (
              <button
                onClick={() => { setFilterMonth(''); setFilterCat(''); setSearch(''); }}
                style={{ fontSize: 12, color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
              >
                Clear filters
              </button>
            )}
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#aaa', padding: 30 }}>
                  {expenses.length === 0 ? 'No expenses recorded yet.' : 'No results for current filters.'}
                </td></tr>
              )}
              {filtered.map((e, i) => (
                <tr key={e.id}>
                  <td style={{ color: '#aaa', fontSize: 12 }}>{i + 1}</td>
                  <td>{e.description}</td>
                  <td>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                      fontSize: 11, fontWeight: 700,
                      background: (CAT_COLORS[e.category] || '#95a5a6') + '22',
                      color: CAT_COLORS[e.category] || '#95a5a6',
                    }}>
                      {e.category}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#e74c3c' }}>{Rs(e.amount)}</td>
                  <td style={{ fontSize: 12, color: '#888' }}>
                    {e.date ? new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-sm"
                        style={{ background: '#e3f0fb', color: '#2980b9', fontWeight: 600 }}
                        onClick={() => openEdit(e)}
                      >Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(e.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f7f8fa', fontWeight: 700 }}>
                  <td colSpan={3} style={{ padding: '10px 12px', color: '#555' }}>Total</td>
                  <td style={{ padding: '10px 12px', color: '#e74c3c', fontSize: 15 }}>{Rs(grandTotal)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Category Breakdown */}
        <div className="section-card" style={{ position: 'sticky', top: 20 }}>
          <div className="section-title">By Category</div>
          {byCategory.length === 0 ? (
            <div style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No data</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {byCategory.map(({ cat, total }) => {
                const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
                const color = CAT_COLORS[cat] || '#95a5a6';
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: '#333' }}>{cat}</span>
                      <span style={{ color: '#555' }}>{Rs(total)}</span>
                    </div>
                    <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.4s' }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{pct.toFixed(1)}%</div>
                  </div>
                );
              })}
              <div style={{ borderTop: '1px solid #eee', paddingTop: 10, marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14, color: '#1a1a2e' }}>
                  <span>Total</span>
                  <span style={{ color: '#e74c3c' }}>{Rs(grandTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
