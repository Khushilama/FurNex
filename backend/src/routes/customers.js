const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM customers ORDER BY name ASC').all());
});

router.post('/', (req, res) => {
  const { name, phone, email, address, notes } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });
  const result = db.prepare(
    'INSERT INTO customers (name, phone, email, address, notes) VALUES (?, ?, ?, ?, ?)'
  ).run(name, phone || '', email || '', address || '', notes || '');
  res.status(201).json(db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const { name, phone, email, address, notes } = req.body;
  const result = db.prepare(
    'UPDATE customers SET name=?, phone=?, email=?, address=?, notes=? WHERE id=?'
  ).run(name, phone, email, address, notes, parseInt(req.params.id));
  if (result.changes === 0) return res.status(404).json({ message: 'Not found' });
  res.json(db.prepare('SELECT * FROM customers WHERE id = ?').get(parseInt(req.params.id)));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM customers WHERE id = ?').run(parseInt(req.params.id));
  if (result.changes === 0) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
