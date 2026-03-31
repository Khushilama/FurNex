import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { api } from '../api/api';

const Rs = (n) => `Rs ${Number(n).toLocaleString('en-IN')}`;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS = ['#f5a623','#e74c3c','#2980b9','#8e44ad','#27ae60','#e67e22','#1abc9c'];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

export default function ProfitLoss() {
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState('All');

  useEffect(() => {
    api.getOrders().then(r => setOrders(r.data)).catch(() => {});
    api.getExpenses().then(r => setExpenses(r.data)).catch(() => {});
    api.getProducts().then(r => setProducts(r.data)).catch(() => {});
  }, []);

  // Filter by year
  const filteredOrders = orders.filter(o => {
    const y = new Date(o.date).getFullYear();
    const m = new Date(o.date).getMonth();
    return y === selectedYear && (selectedMonth === 'All' || m === parseInt(selectedMonth));
  });

  const filteredExpenses = expenses.filter(e => {
    const y = new Date(e.date).getFullYear();
    const m = new Date(e.date).getMonth();
    return y === selectedYear && (selectedMonth === 'All' || m === parseInt(selectedMonth));
  });

  // Summary
  const totalRevenue = filteredOrders
    .filter(o => o.status === 'Delivered')
    .reduce((s, o) => s + Number(o.amount), 0);

  const productMap = Object.fromEntries(products.map(p => [p.id, Number(p.costPerUnit)]));
  const totalCOGS = filteredOrders
    .filter(o => o.status === 'Delivered')
    .reduce((sum, o) => sum + (o.materials || []).reduce((s, m) => s + (productMap[m.productId] || 0) * Number(m.qty), 0), 0);
  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const netProfit = grossProfit - totalExpenses;
  const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0;
  const netMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Monthly data for charts
  const monthlyData = MONTHS.map((month, i) => {
    const mOrders = orders.filter(o => {
      const d = new Date(o.date);
      return d.getFullYear() === selectedYear && d.getMonth() === i && o.status === 'Delivered';
    });
    const mExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === selectedYear && d.getMonth() === i;
    });
    const rev = mOrders.reduce((s, o) => s + Number(o.amount), 0);
    const cogs = mOrders.reduce((sum, o) => sum + (o.materials || []).reduce((s, m) => s + (productMap[m.productId] || 0) * Number(m.qty), 0), 0);
    const exp = mExpenses.reduce((s, e) => s + Number(e.amount), 0);
    return { month, Revenue: rev, COGS: cogs, Expenses: exp, Profit: rev - cogs - exp };
  });

  // Expense by category
  const expenseByCategory = filteredExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {});
  const expensePieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

  // Revenue by order item
  const revenueByItem = filteredOrders
    .filter(o => o.status === 'Delivered')
    .reduce((acc, o) => {
      acc[o.item || 'Other'] = (acc[o.item || 'Other'] || 0) + Number(o.amount);
      return acc;
    }, {});
  const revenuePieData = Object.entries(revenueByItem).map(([name, value]) => ({ name, value }));

  // Monthly table
  const monthlyTable = MONTHS.map((month, i) => {
    const mOrders = orders.filter(o => {
      const d = new Date(o.date);
      return d.getFullYear() === selectedYear && d.getMonth() === i && o.status === 'Delivered';
    });
    const mExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === selectedYear && d.getMonth() === i;
    });
    const rev = mOrders.reduce((s, o) => s + Number(o.amount), 0);
    const exp = mExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const profit = rev - exp;
    return { month, orders: mOrders.length, revenue: rev, expenses: exp, profit };
  }).filter(r => r.revenue > 0 || r.expenses > 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
        <strong>{label}</strong>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, marginTop: 4 }}>
            {p.name}: {Rs(p.value)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title">Profit & Loss</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="form-group">
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="form-group">
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              <option value="All">All Months</option>
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        <div className="stat-card blue">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{Rs(totalRevenue)}</div>
          <div className="stat-sub">delivered orders</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Cost of Goods</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{Rs(totalCOGS)}</div>
          <div className="stat-sub">material costs</div>
        </div>
        <div className={`stat-card ${grossProfit >= 0 ? 'green' : 'red'}`}>
          <div className="stat-label">Gross Profit</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{Rs(grossProfit)}</div>
          <div className="stat-sub">margin {grossMargin}%</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{Rs(totalExpenses)}</div>
          <div className="stat-sub">all categories</div>
        </div>
        <div className={`stat-card ${netProfit >= 0 ? 'green' : 'red'}`}>
          <div className="stat-label">Net Profit</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{Rs(netProfit)}</div>
          <div className="stat-sub">net margin {netMargin}%</div>
        </div>
      </div>

      {/* Revenue vs Expenses Bar Chart */}
      <div className="section-card" style={{ marginTop: 20 }}>
        <div className="section-title">Monthly Revenue vs Expenses ({selectedYear})</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyData} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `Rs ${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Revenue" fill="#27ae60" radius={[4,4,0,0]} />
            <Bar dataKey="Expenses" fill="#e74c3c" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Profit Line Chart */}
      <div className="section-card">
        <div className="section-title">Monthly Net Profit Trend ({selectedYear})</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `Rs ${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone" dataKey="Profit" stroke="#f5a623"
              strokeWidth={2.5} dot={{ r: 4, fill: '#f5a623' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Charts */}
      <div className="dash-two-col">
        <div className="section-card">
          <div className="section-title">Expense Breakdown by Category</div>
          {expensePieData.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: 20 }}>No expense data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={expensePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {expensePieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => Rs(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="section-card">
          <div className="section-title">Revenue by Product/Item</div>
          {revenuePieData.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: 20 }}>No revenue data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={revenuePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${(percent*100).toFixed(0)}%`}>
                  {revenuePieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => Rs(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="section-card">
        <div className="section-title">Monthly Breakdown — {selectedYear}</div>
        {monthlyTable.length === 0 ? (
          <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: 20 }}>No data for this period.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Orders</th>
                <th>Revenue</th>
                <th>Expenses</th>
                <th>Gross Profit</th>
                <th>Margin</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTable.map(row => (
                <tr key={row.month}>
                  <td><strong>{row.month}</strong></td>
                  <td>{row.orders}</td>
                  <td style={{ color: '#27ae60', fontWeight: 600 }}>{Rs(row.revenue)}</td>
                  <td style={{ color: '#e74c3c' }}>{Rs(row.expenses)}</td>
                  <td style={{ fontWeight: 700, color: row.profit >= 0 ? '#27ae60' : '#e74c3c' }}>{Rs(row.profit)}</td>
                  <td style={{ color: '#888' }}>
                    {row.revenue > 0 ? `${((row.profit / row.revenue) * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td>
                    <span className={`badge ${row.profit >= 0 ? 'present' : 'absent'}`}>
                      {row.profit >= 0 ? 'Profit' : 'Loss'}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr style={{ background: '#f7f8fa', fontWeight: 700 }}>
                <td>Total</td>
                <td>{filteredOrders.filter(o => o.status === 'Delivered').length}</td>
                <td style={{ color: '#27ae60' }}>{Rs(totalRevenue)}</td>
                <td style={{ color: '#e74c3c' }}>{Rs(totalExpenses)}</td>
                <td style={{ color: netProfit >= 0 ? '#27ae60' : '#e74c3c' }}>{Rs(netProfit)}</td>
                <td>{netMargin}%</td>
                <td>
                  <span className={`badge ${netProfit >= 0 ? 'present' : 'absent'}`}>
                    {netProfit >= 0 ? 'Profit' : 'Loss'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* Expense Detail Table */}
      <div className="section-card">
        <div className="section-title">Expense Details</div>
        {filteredExpenses.length === 0 ? (
          <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: 20 }}>No expenses for this period.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Date</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(e => (
                <tr key={e.id}>
                  <td>{e.description}</td>
                  <td><span className="badge production">{e.category}</span></td>
                  <td>{new Date(e.date).toLocaleDateString('en-IN')}</td>
                  <td style={{ color: '#e74c3c', fontWeight: 600 }}>{Rs(e.amount)}</td>
                </tr>
              ))}
              <tr style={{ background: '#fde8e8', fontWeight: 700 }}>
                <td colSpan={3}>Total Expenses</td>
                <td style={{ color: '#e74c3c' }}>{Rs(totalExpenses)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
