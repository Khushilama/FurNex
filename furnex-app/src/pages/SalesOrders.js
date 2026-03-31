import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import InvoiceModal from '../components/InvoiceModal';

const Rs = (n) => `Rs ${Number(n).toLocaleString('en-IN')}`;
const today = () => new Date().toISOString().split('T')[0];

const EMPTY_ORDER = { customerName: '', customerId: null, item: '', amount: '', status: 'Pending', date: today(), materials: [] };
const EMPTY_EXP = { description: '', category: 'COGS', amount: '', date: today() };

const STATUSES = ['Pending', 'In Production', 'Delivered'];
const EXP_CATS = ['COGS', 'Payroll', 'VAT', 'Rent', 'Utilities', 'Other'];
const METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other'];

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ order, onClose, onSaved }) {
  const [payments, setPayments] = useState([]);
  const [form, setForm] = useState({ amount: '', method: 'Cash', date: today(), notes: '' });
  const [adding, setAdding] = useState(false);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    api.getPayments(order.id).then(r => setPayments(r.data)).catch(() => {});
    api.getSettings().then(r => setSettings(r.data)).catch(() => {});
  }, [order.id]);

  const cgstRate = Number(settings.cgstRate ?? 0);
  const sgstRate = Number(settings.sgstRate ?? 0);
  const subtotal = Number(order.amount);
  const totalWithGst = subtotal + (subtotal * cgstRate / 100) + (subtotal * sgstRate / 100);
  const paidAmount = Number(order.paidAmount || 0);
  const balance = totalWithGst - paidAmount;

  const addPayment = async () => {
    if (!form.amount || Number(form.amount) <= 0) return;
    setAdding(true);
    await api.addPayment({ orderId: order.id, ...form, amount: Number(form.amount) });
    setForm({ amount: '', method: 'Cash', date: today(), notes: '' });
    const [pay, ] = await Promise.all([
      api.getPayments(order.id).then(r => r.data).catch(() => []),
    ]);
    setPayments(pay);
    setAdding(false);
    onSaved();
  };

  const removePayment = async (id) => {
    await api.deletePayment(id);
    const pay = await api.getPayments(order.id).then(r => r.data).catch(() => []);
    setPayments(pay);
    onSaved();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: 20
    }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 540, maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a2e' }}>Payments — {order.customerName}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{order.item}</div>
          </div>
          <button onClick={onClose} style={{ background: '#f0f0f0', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 18, color: '#555' }}>×</button>
        </div>

        <div style={{ padding: '16px 24px' }}>
          {/* Summary */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <SummaryPill label="Order Total" value={Rs(totalWithGst)} color="#1a1a2e" />
            <SummaryPill label="Amount Paid" value={Rs(paidAmount)} color="#27ae60" />
            <SummaryPill label="Balance Due" value={Rs(balance)} color={balance > 0 ? '#e74c3c' : '#27ae60'} />
          </div>

          {/* Status badge */}
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#888' }}>Payment Status:</span>
            <span style={{
              fontWeight: 700, fontSize: 12, padding: '3px 12px', borderRadius: 20,
              background: order.paymentStatus === 'Paid' ? '#e8f8f0' : order.paymentStatus === 'Partial' ? '#fff3e0' : '#fde8e8',
              color: order.paymentStatus === 'Paid' ? '#27ae60' : order.paymentStatus === 'Partial' ? '#f5a623' : '#e74c3c',
            }}>{order.paymentStatus || 'Unpaid'}</span>
          </div>

          {/* Add payment */}
          {balance > 0 && (
            <div style={{ background: '#f9f9f9', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 12 }}>Record Payment</div>
              <div className="form-row" style={{ gap: 10, marginBottom: 10 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Amount (Rs)</label>
                  <input
                    type="number" placeholder={`Max ${Rs(balance)}`}
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Method</label>
                  <select value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
                    {METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Notes (optional)</label>
                <input placeholder="e.g. Advance payment" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <button className="btn btn-orange" onClick={addPayment} disabled={adding || !form.amount}>
                {adding ? 'Saving...' : 'Record Payment'}
              </button>
            </div>
          )}

          {/* Payment history */}
          <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 10 }}>Payment History</div>
          {payments.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#aaa', padding: '20px 0', fontSize: 13 }}>No payments recorded yet.</div>
          ) : (
            <table>
              <thead>
                <tr><th>Date</th><th>Method</th><th>Amount</th><th>Notes</th><th></th></tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontSize: 12 }}>{new Date(p.date + 'T00:00:00').toLocaleDateString('en-IN')}</td>
                    <td style={{ fontSize: 12 }}>{p.method}</td>
                    <td style={{ fontWeight: 700, color: '#27ae60' }}>{Rs(p.amount)}</td>
                    <td style={{ fontSize: 12, color: '#888' }}>{p.notes || '—'}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => removePayment(p.id)}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryPill({ label, value, color }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', background: '#f7f8fa', borderRadius: 10, padding: '10px 8px' }}>
      <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 15, color }}>{value}</div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SalesOrders() {
  const [orders, setOrders]         = useState([]);
  const [expenses, setExpenses]     = useState([]);
  const [products, setProducts]     = useState([]);
  const [customers, setCustomers]   = useState([]);
  const [orderForm, setOrderForm]   = useState(EMPTY_ORDER);
  const [expForm, setExpForm]       = useState(EMPTY_EXP);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showExpForm, setShowExpForm]     = useState(false);
  const [matEntry, setMatEntry]     = useState({ productId: '', qty: '' });
  const [invoiceOrder, setInvoiceOrder]   = useState(null);
  const [paymentOrder, setPaymentOrder]   = useState(null);

  const load = () => {
    api.getOrders().then(r => setOrders(r.data)).catch(() => {});
    api.getExpenses().then(r => setExpenses(r.data)).catch(() => {});
    api.getProducts().then(r => setProducts(r.data)).catch(() => {});
    api.getCustomers().then(r => setCustomers(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleCustomerSelect = (e) => {
    const id = parseInt(e.target.value);
    if (!id) {
      setOrderForm({ ...orderForm, customerId: null, customerName: '' });
    } else {
      const cust = customers.find(c => c.id === id);
      setOrderForm({ ...orderForm, customerId: id, customerName: cust?.name || '' });
    }
  };

  const addMaterial = () => {
    if (!matEntry.productId || !matEntry.qty) return;
    const product = products.find(p => p.id === parseInt(matEntry.productId));
    if (!product) return;
    const existing = orderForm.materials.find(m => m.productId === parseInt(matEntry.productId));
    let updatedMats;
    if (existing) {
      updatedMats = orderForm.materials.map(m =>
        m.productId === parseInt(matEntry.productId) ? { ...m, qty: Number(matEntry.qty) } : m
      );
    } else {
      updatedMats = [...orderForm.materials, { productId: parseInt(matEntry.productId), name: product.name, unit: product.unit, qty: Number(matEntry.qty) }];
    }
    setOrderForm({ ...orderForm, materials: updatedMats });
    setMatEntry({ productId: '', qty: '' });
  };

  const removeMaterial = (productId) => {
    setOrderForm({ ...orderForm, materials: orderForm.materials.filter(m => m.productId !== productId) });
  };

  const saveOrder = async () => {
    if ((!orderForm.customerName && !orderForm.customerId) || !orderForm.amount) return;
    await api.addOrder(orderForm);
    setOrderForm(EMPTY_ORDER);
    setShowOrderForm(false);
    load();
  };

  const deleteOrder = async (id) => {
    await api.deleteOrder(id);
    load();
  };

  const updateStatus = async (id, status) => {
    const order = orders.find(o => o.id === id);
    await api.updateOrder(id, { ...order, status });
    load();
  };

  const saveExpense = async () => {
    if (!expForm.description || !expForm.amount) return;
    await api.addExpense(expForm);
    setExpForm(EMPTY_EXP);
    setShowExpForm(false);
    load();
  };

  const deleteExpense = async (id) => {
    await api.deleteExpense(id);
    load();
  };

  const totalRevenue = orders.filter(o => o.status === 'Delivered').reduce((s, o) => s + Number(o.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const pending = orders.filter(o => o.status === 'Pending').length;
  const unpaidOrders = orders.filter(o => o.paymentStatus && o.paymentStatus !== 'Paid').length;

  return (
    <div>
      {invoiceOrder && (
        <InvoiceModal
          order={invoiceOrder}
          materials={products}
          customer={customers.find(c => c.id === invoiceOrder.customerId)}
          onClose={() => setInvoiceOrder(null)}
        />
      )}
      {paymentOrder && (
        <PaymentModal
          order={paymentOrder}
          onClose={() => setPaymentOrder(null)}
          onSaved={load}
        />
      )}

      <div className="page-header">
        <div className="page-title">Sales & Orders</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-orange" onClick={() => { setShowOrderForm(!showOrderForm); setOrderForm(EMPTY_ORDER); }}>
            + New Order
          </button>
          <button className="btn btn-primary" onClick={() => setShowExpForm(!showExpForm)}>
            + Add Expense
          </button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
        <div className="stat-card blue">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{orders.length}</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{pending}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Revenue</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{Rs(totalRevenue)}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Unpaid Orders</div>
          <div className="stat-value">{unpaidOrders}</div>
        </div>
      </div>

      {showOrderForm && (
        <div className="section-card">
          <div className="section-title">New Order</div>
          <div className="form-row">
            <div className="form-group">
              <label>Customer</label>
              <select value={orderForm.customerId || ''} onChange={handleCustomerSelect}>
                <option value="">— Select customer —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` (${c.phone})` : ''}</option>)}
              </select>
            </div>
            {!orderForm.customerId && (
              <div className="form-group">
                <label>Or type name manually</label>
                <input placeholder="Customer name" value={orderForm.customerName} onChange={e => setOrderForm({ ...orderForm, customerName: e.target.value })} />
              </div>
            )}
            <div className="form-group">
              <label>Item / Description</label>
              <input placeholder="e.g. Dining Table" value={orderForm.item} onChange={e => setOrderForm({ ...orderForm, item: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Amount (Rs)</label>
              <input type="number" placeholder="0" value={orderForm.amount} onChange={e => setOrderForm({ ...orderForm, amount: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={orderForm.status} onChange={e => setOrderForm({ ...orderForm, status: e.target.value })}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={orderForm.date} onChange={e => setOrderForm({ ...orderForm, date: e.target.value })} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 8 }}>
              Materials Used <span style={{ color: '#aaa', fontWeight: 400 }}>(stock deducts on Delivered)</span>
            </div>
            <div className="form-row" style={{ marginBottom: 8 }}>
              <div className="form-group">
                <label>Material</label>
                <select value={matEntry.productId} onChange={e => setMatEntry({ ...matEntry, productId: e.target.value })}>
                  <option value="">Select material</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (stock: {p.quantity} {p.unit})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Qty</label>
                <input type="number" placeholder="0" value={matEntry.qty} onChange={e => setMatEntry({ ...matEntry, qty: e.target.value })} style={{ minWidth: 80 }} />
              </div>
              <button className="btn btn-sm btn-primary" style={{ alignSelf: 'flex-end' }} onClick={addMaterial}>Add</button>
            </div>
            {orderForm.materials.length > 0 && (
              <table style={{ marginBottom: 8 }}>
                <thead><tr><th>Material</th><th>Qty</th><th></th></tr></thead>
                <tbody>
                  {orderForm.materials.map(m => (
                    <tr key={m.productId}>
                      <td>{m.name}</td>
                      <td>{m.qty} {m.unit}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => removeMaterial(m.productId)}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <button className="btn btn-orange" onClick={saveOrder}>Create Order</button>
        </div>
      )}

      {showExpForm && (
        <div className="section-card">
          <div className="section-title">Add Expense</div>
          <div className="form-row">
            <div className="form-group">
              <label>Description</label>
              <input placeholder="e.g. Wood purchase" value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={expForm.category} onChange={e => setExpForm({ ...expForm, category: e.target.value })}>
                {EXP_CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Amount (Rs)</label>
              <input type="number" placeholder="0" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} />
            </div>
            <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={saveExpense}>Add</button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="section-card">
        <div className="section-title">Orders</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Customer</th>
              <th>Item</th>
              <th>Amount</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Payment</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan={10} style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>No orders yet.</td></tr>}
            {orders.map((o, i) => {
              const paid = Number(o.paidAmount || 0);
              const bal = Number(o.amount) - paid;
              const ps = o.paymentStatus || 'Unpaid';
              return (
                <tr key={o.id}>
                  <td>{i + 1}</td>
                  <td><strong>{o.customerName}</strong></td>
                  <td>
                    <div>{o.item}</div>
                    {(o.materials || []).length > 0 && (
                      <div style={{ fontSize: 11, color: '#aaa' }}>{(o.materials || []).map(m => `${m.name}×${m.qty}`).join(', ')}</div>
                    )}
                  </td>
                  <td>{Rs(o.amount)}</td>
                  <td style={{ color: '#27ae60', fontWeight: 600 }}>{paid > 0 ? Rs(paid) : '—'}</td>
                  <td style={{ color: bal > 0 ? '#e74c3c' : '#27ae60', fontWeight: 600 }}>{bal > 0 ? Rs(bal) : '—'}</td>
                  <td>
                    <span style={{
                      fontWeight: 700, fontSize: 11, padding: '3px 10px', borderRadius: 20,
                      background: ps === 'Paid' ? '#e8f8f0' : ps === 'Partial' ? '#fff3e0' : '#fde8e8',
                      color: ps === 'Paid' ? '#27ae60' : ps === 'Partial' ? '#f5a623' : '#e74c3c',
                    }}>{ps}</span>
                  </td>
                  <td style={{ fontSize: 12 }}>{new Date(o.date + 'T00:00:00').toLocaleDateString('en-IN')}</td>
                  <td>
                    <select
                      className={`badge ${o.status === 'Pending' ? 'pending' : o.status === 'In Production' ? 'production' : 'delivered'}`}
                      value={o.status}
                      onChange={e => updateStatus(o.id, e.target.value)}
                      style={{ border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    {o.stockDeducted ? <span style={{ fontSize: 10, color: '#27ae60', marginLeft: 4 }}>✓</span> : null}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-sm"
                        style={{ background: '#fff3e0', color: '#f5a623', fontWeight: 600 }}
                        onClick={() => setPaymentOrder(o)}
                      >
                        Pay
                      </button>
                      {o.status === 'Delivered' && (
                        <button
                          className="btn btn-sm"
                          style={{ background: '#e8f8f0', color: '#27ae60', fontWeight: 600 }}
                          onClick={() => setInvoiceOrder(o)}
                        >
                          Invoice
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => deleteOrder(o.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expenses Table */}
      <div className="section-card">
        <div className="section-title">Expenses</div>
        <table>
          <thead>
            <tr><th>#</th><th>Description</th><th>Category</th><th>Amount</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {expenses.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>No expenses yet.</td></tr>}
            {expenses.map((e, i) => (
              <tr key={e.id}>
                <td>{i + 1}</td>
                <td>{e.description}</td>
                <td><span className="badge production">{e.category}</span></td>
                <td>{Rs(e.amount)}</td>
                <td>{new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN')}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => deleteExpense(e.id)}>Del</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
