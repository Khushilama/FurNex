const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM materials').all());
});

router.post('/', (req, res) => {
  const { name, category, quantity, unit, minStock, costPerUnit, usedQty } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });
  const result = db.prepare(
    'INSERT INTO materials (name, category, quantity, unit, minStock, costPerUnit, usedQty) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(name, category || '', quantity || 0, unit || 'pcs', minStock || 0, costPerUnit || 0, usedQty || 0);
  res.status(201).json(db.prepare('SELECT * FROM materials WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const { name, category, quantity, unit, minStock, costPerUnit, usedQty } = req.body;
  const result = db.prepare(
    'UPDATE materials SET name=?, category=?, quantity=?, unit=?, minStock=?, costPerUnit=?, usedQty=? WHERE id=?'
  ).run(name, category, quantity, unit, minStock, costPerUnit, usedQty, parseInt(req.params.id));
  if (result.changes === 0) return res.status(404).json({ message: 'Not found' });
  res.json(db.prepare('SELECT * FROM materials WHERE id = ?').get(parseInt(req.params.id)));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM materials WHERE id = ?').run(parseInt(req.params.id));
  if (result.changes === 0) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
