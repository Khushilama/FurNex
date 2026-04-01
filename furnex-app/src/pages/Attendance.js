import React, { useEffect, useState } from 'react';
import { api } from '../api/api';

export default function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEmp, setNewEmp] = useState({ name: '', role: '' });
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null); // { id, name, role }

  const load = () => {
    api.getEmployees().then(r => setEmployees(r.data)).catch(() => {});
    api.getAttendance().then(r => setAttendance(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const todayRecords = attendance.filter(a => a.date === selectedDate);

  const getStatus = (empId) => {
    const rec = todayRecords.find(a => a.employeeId === empId);
    return rec ? rec.status : null;
  };

  const markStatus = async (empId, status) => {
    const existing = todayRecords.find(a => a.employeeId === empId);
    if (existing) return; // already marked
    await api.markAttendance({ employeeId: empId, date: selectedDate, status });
    load();
  };

  const addEmployee = async () => {
    if (!newEmp.name || !newEmp.role) return;
    await api.addEmployee(newEmp);
    setNewEmp({ name: '', role: '' });
    setShowAddEmp(false);
    load();
  };

  const deleteEmployee = async (id) => {
    await api.deleteEmployee(id);
    load();
  };

  const updateEmployee = async () => {
    if (!editingEmp || !editingEmp.name || !editingEmp.role) return;
    await api.updateEmployee(editingEmp.id, { name: editingEmp.name, role: editingEmp.role });
    setEditingEmp(null);
    load();
  };

  const presentCount = todayRecords.filter(a => a.status === 'Present').length;
  const absentCount = todayRecords.filter(a => a.status === 'Absent').length;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Attendance</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="form-group">
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>
          <button className="btn btn-orange" onClick={() => setShowAddEmp(!showAddEmp)}>
            + Add Employee
          </button>
        </div>
      </div>

      {showAddEmp && (
        <div className="section-card" style={{ marginBottom: 16 }}>
          <div className="section-title">Add Employee</div>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input
                placeholder="Employee name"
                value={newEmp.name}
                onChange={e => setNewEmp({ ...newEmp, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input
                placeholder="e.g. Carpenter"
                value={newEmp.role}
                onChange={e => setNewEmp({ ...newEmp, role: e.target.value })}
              />
            </div>
            <button className="btn btn-primary" onClick={addEmployee}>Save</button>
          </div>
        </div>
      )}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Total Employees</div>
          <div className="stat-value">{employees.length}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Present</div>
          <div className="stat-value">{presentCount}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Absent</div>
          <div className="stat-value">{absentCount}</div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">
          Attendance for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Mark</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>No employees yet. Add one above.</td></tr>
            )}
            {employees.map((emp, i) => {
              const status = getStatus(emp.id);
              const isEditing = editingEmp && editingEmp.id === emp.id;
              return (
                <tr key={emp.id}>
                  <td>{i + 1}</td>
                  <td>
                    {isEditing
                      ? <input value={editingEmp.name} onChange={e => setEditingEmp({ ...editingEmp, name: e.target.value })} style={{ width: '100%' }} />
                      : <strong>{emp.name}</strong>
                    }
                  </td>
                  <td>
                    {isEditing
                      ? <input value={editingEmp.role} onChange={e => setEditingEmp({ ...editingEmp, role: e.target.value })} style={{ width: '100%' }} />
                      : emp.role
                    }
                  </td>
                  <td>
                    {status
                      ? <span className={`badge ${status.toLowerCase()}`}>{status}</span>
                      : <span style={{ color: '#aaa', fontSize: 13 }}>Not marked</span>
                    }
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-sm"
                        style={{ background: '#e8f8f0', color: '#27ae60' }}
                        onClick={() => markStatus(emp.id, 'Present')}
                        disabled={!!status}
                      >
                        Present
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{ background: '#fde8e8', color: '#e74c3c' }}
                        onClick={() => markStatus(emp.id, 'Absent')}
                        disabled={!!status}
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {isEditing ? (
                        <>
                          <button className="btn btn-sm" style={{ background: '#e8f0fe', color: '#2563eb' }} onClick={updateEmployee}>Save</button>
                          <button className="btn btn-sm" onClick={() => setEditingEmp(null)}>Cancel</button>
                        </>
                      ) : (
                        <button className="btn btn-sm" style={{ background: '#e8f0fe', color: '#2563eb' }} onClick={() => setEditingEmp({ id: emp.id, name: emp.name, role: emp.role })}>Edit</button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => deleteEmployee(emp.id)}>Remove</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recent Attendance History */}
      <div className="section-card">
        <div className="section-title">Recent Attendance History</div>
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>No records yet.</td></tr>
            )}
            {[...attendance].reverse().slice(0, 20).map((a, i) => {
              const emp = employees.find(e => e.id === a.employeeId);
              return (
                <tr key={i}>
                  <td>{emp ? emp.name : 'Unknown'}</td>
                  <td>{new Date(a.date + 'T00:00:00').toLocaleDateString('en-IN')}</td>
                  <td><span className={`badge ${a.status.toLowerCase()}`}>{a.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
