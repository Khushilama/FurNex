import React, { useEffect, useState } from 'react';
import { api } from '../api/api';

const Rs = (n) => `Rs ${Number(n).toLocaleString('en-IN')}`;

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function Payroll() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [month, setMonth] = useState(currentMonth());
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [generating, setGenerating] = useState(false);

  const load = () => {
    api.getPayroll(month).then(r => setRecords(r.data)).catch(() => {});
    api.getEmployees().then(r => setEmployees(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, [month]);

  const generateMonth = async () => {
    setGenerating(true);
    const existingIds = records.map(r => r.employeeId);
    const missing = employees.filter(e => !existingIds.includes(e.id));
    for (const emp of missing) {
      await api.addPayrollRecord({ employeeId: emp.id, month, baseSalary: 0, bonus: 0, deduction: 0 }).catch(() => {});
    }
    setGenerating(false);
    load();
  };

  const startEdit = (r) => {
    setEditId(r.id);
    setEditForm({ baseSalary: r.baseSalary, bonus: r.bonus, deduction: r.deduction, notes: r.notes || '' });
  };

  const saveEdit = async (id) => {
    await api.updatePayrollRecord(id, editForm);
    setEditId(null);
    load();
  };

  const markPaid = async (r) => {
    await api.updatePayrollRecord(r.id, { ...r, status: 'Paid' });
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this payroll record?')) return;
    await api.deletePayrollRecord(id);
    load();
  };

  const totalPayroll = records.reduce((s, r) => s + Number(r.netSalary), 0);
  const paidCount = records.filter(r => r.status === 'Paid').length;
  const pendingCount = records.filter(r => r.status === 'Pending').length;
  const totalPaid = records.filter(r => r.status === 'Paid').reduce((s, r) => s + Number(r.netSalary), 0);

  const displayMonth = new Date(month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Payroll</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="form-group">
            <input type="month" value={month} onChange={e => setMonth(e.target.value)} />
          </div>
          <button className="btn btn-orange" onClick={generateMonth} disabled={generating}>
            {generating ? 'Generating...' : '⚡ Generate Month'}
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
        <div className="stat-card" style={{ borderTop: '3px solid #2980b9' }}>
          <div className="stat-label">Total Employees</div>
          <div className="stat-value" style={{ color: '#2980b9' }}>{records.length}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #e74c3c' }}>
          <div className="stat-label">Pending</div>
          <div className="stat-value" style={{ color: '#e74c3c' }}>{pendingCount}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #27ae60' }}>
          <div className="stat-label">Paid</div>
          <div className="stat-value" style={{ color: '#27ae60' }}>{paidCount}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #f5a623' }}>
          <div className="stat-label">Total Payroll</div>
          <div className="stat-value" style={{ color: '#f5a623', fontSize: 20 }}>{Rs(totalPayroll)}</div>
          <div className="stat-sub">{Rs(totalPaid)} paid so far</div>
        </div>
      </div>

      <div className="section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
            Payroll — {displayMonth}
          </div>
          {records.length === 0 && employees.length > 0 && (
            <span style={{ fontSize: 13, color: '#f5a623' }}>
              Click "Generate Month" to create records for all employees
            </span>
          )}
        </div>

        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th>Base Salary</th>
              <th>Bonus</th>
              <th>Deduction</th>
              <th>Net Salary</th>
              <th>Status</th>
              <th>Paid On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', color: '#aaa', padding: 30 }}>
                No payroll records for {displayMonth}. Click "Generate Month" to create them.
              </td></tr>
            )}
            {records.map(r => (
              <React.Fragment key={r.id}>
                <tr style={{ background: editId === r.id ? '#fff8f0' : '' }}>
                  <td><strong>{r.employeeName}</strong></td>
                  <td style={{ color: '#888' }}>{r.employeeRole}</td>

                  {editId === r.id ? (
                    <>
                      <td><input type="number" value={editForm.baseSalary} onChange={e => setEditForm({ ...editForm, baseSalary: e.target.value })} style={{ width: 90, padding: '4px 8px', border: '1px solid #f5a623', borderRadius: 4 }} /></td>
                      <td><input type="number" value={editForm.bonus} onChange={e => setEditForm({ ...editForm, bonus: e.target.value })} style={{ width: 80, padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4 }} /></td>
                      <td><input type="number" value={editForm.deduction} onChange={e => setEditForm({ ...editForm, deduction: e.target.value })} style={{ width: 80, padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4 }} /></td>
                      <td style={{ fontWeight: 700, color: '#1a1a2e' }}>
                        {Rs(Number(editForm.baseSalary || 0) + Number(editForm.bonus || 0) - Number(editForm.deduction || 0))}
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{Rs(r.baseSalary)}</td>
                      <td style={{ color: '#27ae60' }}>{r.bonus > 0 ? `+ ${Rs(r.bonus)}` : '—'}</td>
                      <td style={{ color: '#e74c3c' }}>{r.deduction > 0 ? `- ${Rs(r.deduction)}` : '—'}</td>
                      <td style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 15 }}>{Rs(r.netSalary)}</td>
                    </>
                  )}

                  <td>
                    <span className={`badge ${r.status === 'Paid' ? 'present' : 'absent'}`}>{r.status}</span>
                  </td>
                  <td style={{ fontSize: 12, color: '#888' }}>{r.paidOn || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {editId === r.id ? (
                        <>
                          <button className="btn btn-sm btn-orange" onClick={() => saveEdit(r.id)}>Save</button>
                          <button className="btn btn-sm" style={{ background: '#eee', color: '#555' }} onClick={() => setEditId(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-sm" style={{ background: '#e3f0fb', color: '#2980b9', fontWeight: 600 }} onClick={() => startEdit(r)}>Edit</button>
                          {r.status === 'Pending' && (
                            <button className="btn btn-sm" style={{ background: '#e8f8f0', color: '#27ae60', fontWeight: 600 }} onClick={() => markPaid(r)}>Mark Paid</button>
                          )}
                          <button className="btn btn-danger btn-sm" onClick={() => remove(r.id)}>Del</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                {editId === r.id && (
                  <tr style={{ background: '#fff8f0' }}>
                    <td colSpan={9} style={{ padding: '4px 12px 12px' }}>
                      <div className="form-group" style={{ maxWidth: 300 }}>
                        <label style={{ fontSize: 12 }}>Notes</label>
                        <input placeholder="Optional notes..." value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, width: '100%' }} />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
          {records.length > 0 && (
            <tfoot>
              <tr style={{ background: '#f7f8fa', fontWeight: 700 }}>
                <td colSpan={5} style={{ padding: '10px 12px', color: '#555' }}>Total</td>
                <td style={{ padding: '10px 12px', color: '#1a1a2e', fontSize: 15 }}>{Rs(totalPayroll)}</td>
                <td colSpan={3} style={{ padding: '10px 12px', color: '#27ae60', fontSize: 13 }}>{Rs(totalPaid)} paid</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
