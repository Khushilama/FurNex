const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    let query = `
      SELECT p.*, e.name AS "employeeName", e.role AS "employeeRole"
      FROM payroll p JOIN employees e ON p."employeeId" = e.id
    `;
    const params = [];
    if (month) {
      query += ' WHERE p.month = $1';
      params.push(month);
    }
    query += ' ORDER BY p.month DESC, e.name ASC';
    const r = await db.query(query, params);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { employeeId, month, baseSalary, bonus, deduction, notes } = req.body;
    if (!employeeId || !month) return res.status(400).json({ message: 'employeeId and month required' });
    const net = Number(baseSalary || 0) + Number(bonus || 0) - Number(deduction || 0);
    const r = await db.query(
      'INSERT INTO payroll ("employeeId", month, "baseSalary", bonus, deduction, "netSalary", notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [employeeId, month, baseSalary || 0, bonus || 0, deduction || 0, net, notes || '']
    );
    const inserted = await db.query(
      `SELECT p.*, e.name AS "employeeName", e.role AS "employeeRole"
       FROM payroll p JOIN employees e ON p."employeeId" = e.id
       WHERE p.id = $1`,
      [r.rows[0].id]
    );
    res.status(201).json(inserted.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Record already exists for this employee and month' });
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existingR = await db.query('SELECT * FROM payroll WHERE id=$1', [id]);
    if (existingR.rowCount === 0) return res.status(404).json({ message: 'Not found' });
    const existing = existingR.rows[0];

    const { baseSalary, bonus, deduction, status, notes } = req.body;
    const net = Number(baseSalary ?? existing.baseSalary) + Number(bonus ?? existing.bonus) - Number(deduction ?? existing.deduction);
    const newStatus = status || existing.status;
    const paidOn = newStatus === 'Paid' && existing.status !== 'Paid'
      ? new Date().toISOString().split('T')[0]
      : existing.paidOn;

    await db.query(
      'UPDATE payroll SET "baseSalary"=$1, bonus=$2, deduction=$3, "netSalary"=$4, status=$5, "paidOn"=$6, notes=$7 WHERE id=$8',
      [
        baseSalary ?? existing.baseSalary,
        bonus ?? existing.bonus,
        deduction ?? existing.deduction,
        net, newStatus, paidOn,
        notes ?? existing.notes,
        id,
      ]
    );

    const updated = await db.query(
      `SELECT p.*, e.name AS "employeeName", e.role AS "employeeRole"
       FROM payroll p JOIN employees e ON p."employeeId" = e.id
       WHERE p.id = $1`,
      [id]
    );
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await db.query('DELETE FROM payroll WHERE id=$1', [parseInt(req.params.id)]);
    if (r.rowCount === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
