const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM rates').all());
});

router.post('/', (req, res) => {
  const { name, category, ratePerUnit, unit, description } = req.body;
  if (!name || !ratePerUnit) return res.status(400).json({ message: 'Missing fields' });
  const result = db.prepare(
    'INSERT INTO rates (name, category, ratePerUnit, unit, description) VALUES (?, ?, ?, ?, ?)'
  ).run(name, category || '', ratePerUnit, unit || 'per piece', description || '');
  res.status(201).json(db.prepare('SELECT * FROM rates WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const { name, category, ratePerUnit, unit, description } = req.body;
  const result = db.prepare(
    'UPDATE rates SET name=?, category=?, ratePerUnit=?, unit=?, description=? WHERE id=?'
  ).run(name, category, ratePerUnit, unit, description, parseInt(req.params.id));
  if (result.changes === 0) return res.status(404).json({ message: 'Not found' });
  res.json(db.prepare('SELECT * FROM rates WHERE id = ?').get(parseInt(req.params.id)));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM rates WHERE id = ?').run(parseInt(req.params.id));
  if (result.changes === 0) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
