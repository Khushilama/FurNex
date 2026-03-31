import React, { useEffect, useState } from 'react';
import { api } from '../api/api';

const Rs = (n) => `Rs ${Number(n).toLocaleString('en-IN')}`;
const today = () => new Date().toISOString().split('T')[0];
const inDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };

const EMPTY_FORM = {
  customerName: '', customerId: null, items: [], status: 'Draft',
  date: today(), validUntil: inDays(30), notes: ''
};
const EMPTY_LINE = { description: '', qty: 1, rate: '' };

const STATUS_COLORS = { Draft: '#aaa', Sent: '#2980b9', Approved: '#27ae60', Rejected: '#e74c3c', Converted: '#f5a623' };

export default function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers]   = useState([]);
  const [settings, setSettings]     = useState({});
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [lineEntry, setLineEntry]   = useState(EMPTY_LINE);
  const [preview, setPreview]       = useState(null);
  const [converting, setConverting] = useState(null);

  const load = () => {
    api.getQuotations().then(r => setQuotations(r.data)).catch(() => {});
    api.getCustomers().then(r => setCustomers(r.data)).catch(() => {});
    api.getSettings().then(r => setSettings(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const cgstRate = Number(settings.cgstRate ?? 9);
  const sgstRate = Number(settings.sgstRate ?? 9);

  const calcTotals = (items) => {
    const subtotal = items.reduce((s, i) => s + Number(i.qty) * Number(i.rate || 0), 0);
    const cgstAmount = (subtotal * cgstRate) / 100;
    const sgstAmount = (subtotal * sgstRate) / 100;
    return { subtotal, cgstAmount, sgstAmount, totalAmount: subtotal + cgstAmount + sgstAmount };
  };

  const handleCustomerSelect = (e) => {
    const id = parseInt(e.target.value);
    if (!id) {
      setForm({ ...form, customerId: null, customerName: '' });
    } else {
      const c = customers.find(x => x.id === id);
      setForm({ ...form, customerId: id, customerName: c?.name || '' });
    }
  };

  const addLine = () => {
    if (!lineEntry.description || !lineEntry.rate) return;
    setForm({ ...form, items: [...form.items, { ...lineEntry, qty: Number(lineEntry.qty) || 1, rate: Number(lineEntry.rate) }] });
    setLineEntry(EMPTY_LINE);
  };

  const removeLine = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const saveQuotation = async () => {
    if (!form.customerName && !form.customerId) return;
    const totals = calcTotals(form.items);
    await api.addQuotation({ ...form, cgstRate, sgstRate, ...totals });
    setForm(EMPTY_FORM);
    setShowForm(false);
    load();
  };

  const updateStatus = async (q, status) => {
    await api.updateQuotation(q.id, { status });
    load();
  };

  const deleteQuotation = async (id) => {
    if (!window.confirm('Delete this quotation?')) return;
    await api.deleteQuotation(id);
    load();
  };

  const convertToOrder = async (q) => {
    setConverting(q.id);
    try {
      const items = typeof q.items === 'string' ? JSON.parse(q.items) : q.items;
      const description = items.map(i => i.description).join(', ') || 'Order from quotation';
      await api.addOrder({
        customerName: q.customerName,
        customerId: q.customerId,
        item: description,
        amount: q.totalAmount,
        status: 'Pending',
        date: today(),
        materials: []
      });
      await api.updateQuotation(q.id, { status: 'Converted' });
      load();
    } catch (err) {
      alert('Failed to convert quotation');
    } finally {
      setConverting(null);
    }
  };

  const formTotals = calcTotals(form.items);

  return (
    <div>
      {/* Preview Modal */}
      {preview && <QuotePreview q={preview} settings={settings} customers={customers} onClose={() => setPreview(null)} />}

      <div className="page-header">
        <div className="page-title">Quotations</div>
        <button className="btn btn-orange" onClick={() => { setForm(EMPTY_FORM); setLineEntry(EMPTY_LINE); setShowForm(!showForm); }}>
          + New Quotation
        </button>
      </div>

      {/* Summary cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
        {['Draft', 'Sent', 'Approved', 'Converted'].map(s => (
          <div className="stat-card" key={s} style={{ borderTop: `3px solid ${STATUS_COLORS[s]}` }}>
            <div className="stat-label">{s}</div>
            <div className="stat-value" style={{ color: STATUS_COLORS[s] }}>
              {quotations.filter(q => q.status === s).length}
            </div>
          </div>
        ))}
      </div>

      {/* New Quotation Form */}
      {showForm && (
        <div className="section-card" style={{ marginBottom: 20 }}>
          <div className="section-title">New Quotation</div>
          <div className="form-row">
            <div className="form-group">
              <label>Customer</label>
              <select value={form.customerId || ''} onChange={handleCustomerSelect}>
                <option value="">— Select customer —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` (${c.phone})` : ''}</option>)}
              </select>
            </div>
            {!form.customerId && (
              <div className="form-group">
                <label>Or type name manually</label>
                <input placeholder="Customer name" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} />
              </div>
            )}
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Valid Until</label>
              <input type="date" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} />
            </div>
          </div>

          {/* Line Items */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 10 }}>Line Items</div>
            <div className="form-row" style={{ marginBottom: 8, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 3 }}>
                <label>Description</label>
                <input placeholder="e.g. Dining Table" value={lineEntry.description} onChange={e => setLineEntry({ ...lineEntry, description: e.target.value })} />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 80 }}>
                <label>Qty</label>
                <input type="number" min="1" value={lineEntry.qty} onChange={e => setLineEntry({ ...lineEntry, qty: e.target.value })} />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 100 }}>
                <label>Rate (Rs)</label>
                <input type="number" placeholder="0" value={lineEntry.rate} onChange={e => setLineEntry({ ...lineEntry, rate: e.target.value })} />
              </div>
              <button className="btn btn-sm btn-primary" style={{ marginBottom: 4 }} onClick={addLine}>Add</button>
            </div>

            {form.items.length > 0 && (
              <table style={{ marginBottom: 12 }}>
                <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th><th></th></tr></thead>
                <tbody>
                  {form.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.description}</td>
                      <td>{item.qty}</td>
                      <td>{Rs(item.rate)}</td>
                      <td style={{ fontWeight: 600 }}>{Rs(item.qty * item.rate)}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => removeLine(idx)}>×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Totals preview */}
            {form.items.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: 260, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#666' }}>
                    <span>Subtotal</span><span>{Rs(formTotals.subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#666' }}>
                    <span>CGST ({cgstRate}%)</span><span>{Rs(formTotals.cgstAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#666' }}>
                    <span>SGST ({sgstRate}%)</span><span>{Rs(formTotals.sgstAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 800, color: '#1a1a2e', borderTop: '1px solid #eee', marginTop: 4 }}>
                    <span>Total</span><span style={{ color: '#f5a623' }}>{Rs(formTotals.totalAmount)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="form-group" style={{ maxWidth: 400 }}>
            <label>Notes</label>
            <input placeholder="Optional notes or terms..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button className="btn btn-orange" onClick={saveQuotation} disabled={!form.customerName && !form.customerId}>
              Create Quotation
            </button>
            <button className="btn" style={{ background: '#eee', color: '#555' }} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Quotations Table */}
      <div className="section-card">
        <div className="section-title">All Quotations</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Valid Until</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotations.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#aaa', padding: 30 }}>No quotations yet.</td></tr>
            )}
            {quotations.map((q, i) => (
              <tr key={q.id}>
                <td>{i + 1}</td>
                <td><strong>{q.customerName}</strong></td>
                <td>{q.date ? new Date(q.date + 'T00:00:00').toLocaleDateString('en-IN') : '—'}</td>
                <td style={{ color: q.validUntil && new Date(q.validUntil) < new Date() && q.status === 'Sent' ? '#e74c3c' : '#555' }}>
                  {q.validUntil ? new Date(q.validUntil + 'T00:00:00').toLocaleDateString('en-IN') : '—'}
                </td>
                <td style={{ fontWeight: 600 }}>{Rs(q.totalAmount)}</td>
                <td>
                  <select
                    value={q.status}
                    onChange={e => updateStatus(q, e.target.value)}
                    style={{
                      border: 'none', background: 'transparent', fontWeight: 700, cursor: 'pointer',
                      color: STATUS_COLORS[q.status] || '#555'
                    }}
                    disabled={q.status === 'Converted'}
                  >
                    {['Draft', 'Sent', 'Approved', 'Rejected', 'Converted'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm" style={{ background: '#f0f0f0', color: '#555' }} onClick={() => setPreview(q)}>
                      Preview
                    </button>
                    {q.status !== 'Converted' && q.status !== 'Rejected' && (
                      <button
                        className="btn btn-sm"
                        style={{ background: '#e8f8f0', color: '#27ae60', fontWeight: 600 }}
                        onClick={() => convertToOrder(q)}
                        disabled={converting === q.id}
                      >
                        {converting === q.id ? '...' : '→ Order'}
                      </button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => deleteQuotation(q.id)}>Del</button>
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

// ── Quotation Preview Modal ───────────────────────────────────────────────────
function QuotePreview({ q, settings, customers, onClose }) {
  const items = typeof q.items === 'string' ? JSON.parse(q.items || '[]') : (q.items || []);
  const customer = customers.find(c => c.id === q.customerId);
  const quoteNo = `QT-${String(q.id).padStart(4, '0')}`;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20
    }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 700, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <button onClick={() => window.print()} style={{ background: '#1a1a2e', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            Print / Save PDF
          </button>
          <button onClick={onClose} style={{ background: '#f0f0f0', color: '#555', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
            Close
          </button>
        </div>

        <div id="invoice-print-area" style={{ padding: '36px 40px', fontFamily: 'Arial, sans-serif', fontSize: 14, color: '#222' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#f5a623', letterSpacing: 1 }}>{settings?.businessName || 'FurNex'}</div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>Workshop Management</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 8, lineHeight: 1.6 }}>
                {settings?.businessAddress && <div>{settings.businessAddress}</div>}
                {settings?.businessPhone && <div>Phone: {settings.businessPhone}</div>}
                {settings?.businessEmail && <div>Email: {settings.businessEmail}</div>}
                {settings?.businessGST && <div>GST: {settings.businessGST}</div>}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>QUOTATION</div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 6 }}><strong>Quote No:</strong> {quoteNo}</div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 3 }}><strong>Date:</strong> {q.date ? new Date(q.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}</div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 3 }}><strong>Valid Until:</strong> {q.validUntil ? new Date(q.validUntil + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}</div>
            </div>
          </div>

          <div style={{ height: 2, background: 'linear-gradient(to right, #f5a623, #1a1a2e)', marginBottom: 24, borderRadius: 2 }} />

          {/* Bill To */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Quote For</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{q.customerName}</div>
            {customer && (
              <div style={{ fontSize: 13, color: '#555', marginTop: 4, lineHeight: 1.7 }}>
                {customer.phone && <div>Phone: {customer.phone}</div>}
                {customer.email && <div>Email: {customer.email}</div>}
                {customer.address && <div>Address: {customer.address}</div>}
              </div>
            )}
          </div>

          {/* Items */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
            <thead>
              <tr style={{ background: '#1a1a2e', color: '#fff' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12 }}>#</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12 }}>Description</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12 }}>Qty</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12 }}>Rate</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px 12px', color: '#555' }}>{idx + 1}</td>
                  <td style={{ padding: '10px 12px' }}>{item.description}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>{item.qty}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{Rs(item.rate)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{Rs(Number(item.qty) * Number(item.rate))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
            <div style={{ width: 300 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#666' }}>
                <span>Subtotal</span><span>{Rs(q.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#666' }}>
                <span>CGST ({q.cgstRate}%)</span><span>{Rs(q.cgstAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#666' }}>
                <span>SGST ({q.sgstRate}%)</span><span>{Rs(q.sgstAmount)}</span>
              </div>
              <div style={{ height: 1, background: '#eee', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontWeight: 800, fontSize: 16, color: '#1a1a2e' }}>
                <span>Total</span><span style={{ color: '#f5a623' }}>{Rs(q.totalAmount)}</span>
              </div>
            </div>
          </div>

          {q.notes && (
            <div style={{ background: '#f9f9f9', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#555', marginBottom: 20 }}>
              <strong>Notes:</strong> {q.notes}
            </div>
          )}

          <div style={{ borderTop: '1px solid #eee', paddingTop: 20, textAlign: 'center', color: '#aaa', fontSize: 12 }}>
            <p>This quotation is valid until {q.validUntil ? new Date(q.validUntil + 'T00:00:00').toLocaleDateString('en-IN') : 'further notice'}.</p>
            <p style={{ marginTop: 4 }}>Prices are subject to change. Contact us to confirm your order.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
