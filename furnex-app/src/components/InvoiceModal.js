import React, { useRef, useEffect, useState } from 'react';
import { api } from '../api/api';

const Rs = (n) => `Rs ${Number(n).toLocaleString('en-IN')}`;

export default function InvoiceModal({ order, materials, customer, onClose }) {
  const printRef = useRef();
  const [settings, setSettings] = useState(null);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    api.getSettings().then(r => setSettings(r.data)).catch(() => {});
    api.getPayments(order.id).then(r => setPayments(r.data)).catch(() => {});
  }, [order.id]);

  const handlePrint = () => window.print();

  const invoiceNo = `${settings?.invoicePrefix || 'INV'}-${String(order.id).padStart(4, '0')}`;
  const invoiceDate = new Date(order.date + 'T00:00:00').toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const productMap = Object.fromEntries((materials || []).map(p => [p.id, p]));
  const orderMaterials = order.materials || [];

  const subtotal = Number(order.amount);
  const cgstRate = Number(settings?.cgstRate ?? 0);
  const sgstRate = Number(settings?.sgstRate ?? 0);
  const cgstAmount = (subtotal * cgstRate) / 100;
  const sgstAmount = (subtotal * sgstRate) / 100;
  const totalAmount = subtotal + cgstAmount + sgstAmount;
  const paidAmount = Number(order.paidAmount || 0);
  const balanceDue = totalAmount - paidAmount;

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}>
        <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 720, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

          {/* Action Buttons */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderBottom: '1px solid #f0f0f0' }}>
            <button onClick={handlePrint} style={{
              background: '#1a1a2e', color: '#fff', border: 'none',
              padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 14
            }}>Print / Save PDF</button>
            <button onClick={onClose} style={{
              background: '#f0f0f0', color: '#555', border: 'none',
              padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 14
            }}>Close</button>
          </div>

          {/* Invoice Content */}
          <div id="invoice-print-area" ref={printRef} style={{ padding: '36px 40px', fontFamily: 'Arial, sans-serif', fontSize: 14, color: '#222' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#f5a623', letterSpacing: 1 }}>
                  {settings?.businessName || 'FurNex'}
                </div>
                <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>Workshop Management</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 8, lineHeight: 1.6 }}>
                  {settings?.businessAddress && <div>{settings.businessAddress}</div>}
                  {settings?.businessPhone && <div>Phone: {settings.businessPhone}</div>}
                  {settings?.businessEmail && <div>Email: {settings.businessEmail}</div>}
                  {settings?.businessGST && <div>GST: {settings.businessGST}</div>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>INVOICE</div>
                <div style={{ fontSize: 13, color: '#555', marginTop: 6 }}><strong>Invoice No:</strong> {invoiceNo}</div>
                <div style={{ fontSize: 13, color: '#555', marginTop: 3 }}><strong>Date:</strong> {invoiceDate}</div>
                <div style={{ marginTop: 8, display: 'inline-block', background: '#e8f8f0', color: '#27ae60', padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  {order.status}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 2, background: 'linear-gradient(to right, #f5a623, #1a1a2e)', marginBottom: 24, borderRadius: 2 }} />

            {/* Bill To */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Bill To</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{order.customerName}</div>
              {customer && (
                <div style={{ fontSize: 13, color: '#555', marginTop: 4, lineHeight: 1.7 }}>
                  {customer.phone && <div>Phone: {customer.phone}</div>}
                  {customer.email && <div>Email: {customer.email}</div>}
                  {customer.address && <div>Address: {customer.address}</div>}
                </div>
              )}
            </div>

            {/* Order Items */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
              <thead>
                <tr style={{ background: '#1a1a2e', color: '#fff' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12 }}>#</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12 }}>Description</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', color: '#555' }}>1</td>
                  <td style={{ padding: '12px' }}>
                    <strong>{order.item}</strong>
                    {orderMaterials.length > 0 && (
                      <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                        Materials: {orderMaterials.map(m => `${m.name} × ${m.qty} ${m.unit || ''}`).join(', ')}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>{Rs(subtotal)}</td>
                </tr>
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
              <div style={{ width: 300 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#666' }}>
                  <span>Subtotal</span>
                  <span>{Rs(subtotal)}</span>
                </div>
                {cgstRate > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#666' }}>
                    <span>CGST ({cgstRate}%)</span>
                    <span>{Rs(cgstAmount)}</span>
                  </div>
                )}
                {sgstRate > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#666' }}>
                    <span>SGST ({sgstRate}%)</span>
                    <span>{Rs(sgstAmount)}</span>
                  </div>
                )}
                <div style={{ height: 1, background: '#eee', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontWeight: 800, fontSize: 16, color: '#1a1a2e' }}>
                  <span>Total</span>
                  <span style={{ color: '#f5a623' }}>{Rs(totalAmount)}</span>
                </div>
                {paidAmount > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, color: '#27ae60' }}>
                      <span>Amount Paid</span>
                      <span>- {Rs(paidAmount)}</span>
                    </div>
                    <div style={{ height: 1, background: '#eee', margin: '6px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 700, fontSize: 15, color: balanceDue > 0 ? '#e74c3c' : '#27ae60' }}>
                      <span>Balance Due</span>
                      <span>{Rs(balanceDue)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Payment History */}
            {payments.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Payment History</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#f7f8fa' }}>
                      <th style={{ padding: '6px 10px', textAlign: 'left', color: '#888' }}>Date</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left', color: '#888' }}>Method</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right', color: '#888' }}>Amount</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left', color: '#888' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '6px 10px' }}>{new Date(p.date + 'T00:00:00').toLocaleDateString('en-IN')}</td>
                        <td style={{ padding: '6px 10px' }}>{p.method}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600, color: '#27ae60' }}>{Rs(p.amount)}</td>
                        <td style={{ padding: '6px 10px', color: '#888' }}>{p.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            <div style={{ borderTop: '1px solid #eee', paddingTop: 20, textAlign: 'center', color: '#aaa', fontSize: 12 }}>
              <p>Thank you for your business! We hope to serve you again.</p>
              <p style={{ marginTop: 4 }}>This is a computer-generated invoice. No signature required.</p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
