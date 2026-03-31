const express = require('express');
const router = express.Router();
const db = require('../database');

const today = () => new Date().toISOString().split('T')[0];

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM quotations ORDER BY id DESC').all());
});

router.get('/:id', (req, res) => {
  const q = db.prepare('SELECT * FROM quotations WHERE id = ?').get(parseInt(req.params.id));
  if (!q) return res.status(404).json({ message: 'Not found' });
  res.json(q);
});

router.post('/', (req, res) => {
  const { customerName, customerId, items, subtotal, cgstRate, sgstRate, cgstAmount, sgstAmount, totalAmount, status, date, validUntil, notes } = req.body;
  if (!customerName) return res.status(400).json({ message: 'customerName required' });
  const result = db.prepare(
    `INSERT INTO quotations (customerName, customerId, items, subtotal, cgstRate, sgstRate, cgstAmount, sgstAmount, totalAmount, status, date, validUntil, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    customerName, customerId || null,
    JSON.stringify(items || []),
    subtotal || 0, cgstRate ?? 9, sgstRate ?? 9, cgstAmount || 0, sgstAmount || 0, totalAmount || 0,
    status || 'Draft', date || today(), validUntil || null, notes || ''
  );
  res.status(201).json(db.prepare('SELECT * FROM quotations WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const existing = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ message: 'Not found' });
  const { customerName, customerId, items, subtotal, cgstRate, sgstRate, cgstAmount, sgstAmount, totalAmount, status, date, validUntil, notes } = req.body;
  db.prepare(
    `UPDATE quotations SET customerName=?, customerId=?, items=?, subtotal=?, cgstRate=?, sgstRate=?, cgstAmount=?, sgstAmount=?, totalAmount=?, status=?, date=?, validUntil=?, notes=? WHERE id=?`
  ).run(
    customerName ?? existing.customerName,
    customerId ?? existing.customerId,
    items !== undefined ? JSON.stringify(items) : existing.items,
    subtotal ?? existing.subtotal,
    cgstRate ?? existing.cgstRate,
    sgstRate ?? existing.sgstRate,
    cgstAmount ?? existing.cgstAmount,
    sgstAmount ?? existing.sgstAmount,
    totalAmount ?? existing.totalAmount,
    status ?? existing.status,
    date ?? existing.date,
    validUntil ?? existing.validUntil,
    notes ?? existing.notes,
    id
  );
  res.json(db.prepare('SELECT * FROM quotations WHERE id = ?').get(id));
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (!db.prepare('SELECT id FROM quotations WHERE id = ?').get(id)) return res.status(404).json({ message: 'Not found' });
  db.prepare('DELETE FROM quotations WHERE id = ?').run(id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
