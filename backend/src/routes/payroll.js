const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { month } = req.query;
  let query = `
    SELECT p.*, e.name AS employeeName, e.role AS employeeRole
    FROM payroll p JOIN employees e ON p.employeeId = e.id
  `;
  const params = [];
  if (month) { query += ' WHERE p.month = ?'; params.push(month); }
  query += ' ORDER BY p.month DESC, e.name ASC';
  res.json(db.prepare(query).all(...params));
});

router.post('/', (req, res) => {
  const { employeeId, month, baseSalary, bonus, deduction, notes } = req.body;
  if (!employeeId || !month) return res.status(400).json({ message: 'employeeId and month required' });
  const net = Number(baseSalary || 0) + Number(bonus || 0) - Number(deduction || 0);
  try {
    const result = db.prepare(
      'INSERT INTO payroll (employeeId, month, baseSalary, bonus, deduction, netSalary, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(employeeId, month, baseSalary || 0, bonus || 0, deduction || 0, net, notes || '');
    res.status(201).json(db.prepare(
      'SELECT p.*, e.name AS employeeName, e.role AS employeeRole FROM payroll p JOIN employees e ON p.employeeId = e.id WHERE p.id = ?'
    ).get(result.lastInsertRowid));
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ message: 'Record already exists for this employee and month' });
    throw e;
  }
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const existing = db.prepare('SELECT * FROM payroll WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ message: 'Not found' });

  const { baseSalary, bonus, deduction, status, notes } = req.body;
  const net = Number(baseSalary ?? existing.baseSalary) + Number(bonus ?? existing.bonus) - Number(deduction ?? existing.deduction);
  const newStatus = status || existing.status;
  const paidOn = newStatus === 'Paid' && existing.status !== 'Paid'
    ? new Date().toISOString().split('T')[0]
    : existing.paidOn;

  db.prepare(
    'UPDATE payroll SET baseSalary=?, bonus=?, deduction=?, netSalary=?, status=?, paidOn=?, notes=? WHERE id=?'
  ).run(
    baseSalary ?? existing.baseSalary,
    bonus ?? existing.bonus,
    deduction ?? existing.deduction,
    net, newStatus, paidOn,
    notes ?? existing.notes,
    id
  );
  res.json(db.prepare(
    'SELECT p.*, e.name AS employeeName, e.role AS employeeRole FROM payroll p JOIN employees e ON p.employeeId = e.id WHERE p.id = ?'
  ).get(id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM payroll WHERE id = ?').run(parseInt(req.params.id));
  if (result.changes === 0) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
