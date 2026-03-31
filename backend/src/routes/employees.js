const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM employees').all());
});

router.post('/', (req, res) => {
  const { name, role } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });
  const result = db.prepare('INSERT INTO employees (name, role) VALUES (?, ?)').run(name, role || '');
  res.status(201).json({ id: result.lastInsertRowid, name, role });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM employees WHERE id = ?').run(parseInt(req.params.id));
  if (result.changes === 0) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
