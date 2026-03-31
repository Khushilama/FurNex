import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api/api';

const Rs = (n) => `Rs ${Number(n).toLocaleString('en-IN')}`;

const EXPENSE_COLORS = ['#e74c3c', '#2980b9', '#f5a623', '#8e44ad', '#27ae60'];

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    api.getEmployees().then(r => setEmployees(r.data)).catch(() => {});
    api.getAttendance().then(r => setAttendance(r.data)).catch(() => {});
    api.getProducts().then(r => setProducts(r.data)).catch(() => {});
    api.getOrders().then(r => setOrders(r.data)).catch(() => {});
    api.getExpenses().then(r => setExpenses(r.data)).catch(() => {});
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayAtt = attendance.filter(a => a.date === today);
  const presentToday = todayAtt.filter(a => a.status === 'Present').length;
  const absentToday = todayAtt.filter(a => a.status === 'Absent').length;

  const lowStock = products.filter(p => p.quantity <= p.minStock);

  const totalSales = orders
    .filter(o => o.status === 'Delivered')
    .reduce((s, o) => s + Number(o.amount), 0);

  const productMap = Object.fromEntries(products.map(p => [p.id, Number(p.costPerUnit)]));
  const totalCOGS = orders
    .filter(o => o.status === 'Delivered')
    .reduce((sum, o) => sum + (o.materials || []).reduce((s, m) => s + (productMap[m.productId] || 0) * Number(m.qty), 0), 0);
  const grossProfit = totalSales - totalCOGS;
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const netProfit = grossProfit - totalExpenses;
  const margin = totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(0) : 0;
  const netMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(0) : 0;

  // Attendance last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().split('T')[0];
    const dayAtt = attendance.filter(a => a.date === ds);
    return {
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      Present: dayAtt.filter(a => a.status === 'Present').length,
      Absent: dayAtt.filter(a => a.status === 'Absent').length,
    };
  });

  // Orders by status
  const pending = orders.filter(o => o.status === 'Pending').length;
  const inProd = orders.filter(o => o.status === 'In Production').length;
  const delivered = orders.filter(o => o.status === 'Delivered').length;
  const totalOrders = orders.length || 1;

  // Expense breakdown
  const expenseGroups = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {});
  const maxExp = Math.max(...Object.values(expenseGroups), 1);

  return (
    <div>
      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-label">Present Today</div>
          <div className="stat-value">{presentToday}</div>
          <div className="stat-sub">of {employees.length} employees</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Absent Today</div>
          <div className="stat-value">{absentToday}</div>
          <div className="stat-sub">{absentToday > 0 ? `${absentToday} on leave` : 'All present'}</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Low Stock Items</div>
          <div className="stat-value">{lowStock.length}</div>
          <div className="stat-sub">below minimum</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">{Rs(totalSales)}</div>
          <div className="stat-sub">{orders.filter(o => o.status === 'Delivered').length} orders total</div>
        </div>
      </div>

      {/* Profit & Loss */}
      <div className="section-card">
        <div className="section-title">Profit & Loss Summary</div>
        <div className="pl-grid">
          <div className="pl-item">
            <label>Total Sales</label>
            <div className="amount">{Rs(totalSales)}</div>
            <div className="sub">delivered orders</div>
          </div>
          <div className="pl-item">
            <label>Cost of Goods</label>
            <div className="amount">{Rs(totalCOGS)}</div>
            <div className="sub">material costs</div>
          </div>
          <div className="pl-item">
            <label>Gross Profit</label>
            <div className={`amount ${grossProfit < 0 ? 'neg' : 'pos'}`}>{Rs(grossProfit)}</div>
            <div className="sub">margin {margin}%</div>
          </div>
          <div className="pl-item">
            <label>Total Expenses</label>
            <div className="amount neg">{Rs(totalExpenses)}</div>
            <div className="sub">COGS + payroll + VAT</div>
          </div>
          <div className="pl-item">
            <label>Net Profit</label>
            <div className={`amount ${netProfit < 0 ? 'neg' : 'pos'}`}>{Rs(netProfit)}</div>
            <div className="sub">net margin {netMargin}%</div>
          </div>
        </div>

        {/* Expense Breakdown */}
        {Object.keys(expenseGroups).length > 0 && (
          <>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 10, marginTop: 8 }}>Expense Breakdown</div>
            {Object.entries(expenseGroups).map(([cat, amt], i) => (
              <div className="expense-bar-row" key={cat}>
                <div className="expense-label">{cat}</div>
                <div className="expense-bar-wrap">
                  <div
                    className="expense-bar-fill"
                    style={{
                      width: `${(amt / maxExp) * 100}%`,
                      background: EXPENSE_COLORS[i % EXPENSE_COLORS.length]
                    }}
                  />
                </div>
                <div className="expense-amount">{Rs(amt)}</div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="dash-two-col">
        {/* Attendance Chart */}
        <div className="section-card">
          <div className="section-title">Attendance — Last 7 Days</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={last7} barSize={16}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="Present" fill="#27ae60" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Absent" fill="#e74c3c" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by Status */}
        <div className="section-card">
          <div className="section-title">Orders by Status</div>
          {[
            { label: 'Pending', count: pending, cls: 'pending' },
            { label: 'In Production', count: inProd, cls: 'production' },
            { label: 'Delivered', count: delivered, cls: 'delivered' },
          ].map(({ label, count, cls }) => (
            <div className="order-status-row" key={label}>
              <div className="order-status-label">
                <span className={`dot ${cls}`} />
                {label}
              </div>
              <div className="order-bar-wrap">
                <div
                  className={`order-bar ${cls}`}
                  style={{ width: `${(count / totalOrders) * 100}%` }}
                />
              </div>
              <strong style={{ minWidth: 20, textAlign: 'right' }}>{count}</strong>
            </div>
          ))}

          {/* Low Stock Alerts */}
          {lowStock.length > 0 && (
            <>
              <div style={{ fontSize: 13, color: '#e74c3c', marginTop: 20, marginBottom: 10, fontWeight: 600 }}>
                ⚠ Low Stock Alerts
              </div>
              {lowStock.map(p => (
                <div className="alert-row" key={p.id}>
                  <span className="alert-icon">!</span>
                  <span><strong>{p.name}</strong> — only {p.quantity} {p.unit} left (min: {p.minStock})</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
