const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM expenses ORDER BY date DESC').all());
});

router.post('/', (req, res) => {
  const { description, category, amount, date } = req.body;
  if (!description || !amount) return res.status(400).json({ message: 'Missing fields' });
  const result = db.prepare(
    'INSERT INTO expenses (description, category, amount, date) VALUES (?, ?, ?, ?)'
  ).run(description, category || 'Other', amount, date || new Date().toISOString().split('T')[0]);
  res.status(201).json(db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ message: 'Not found' });
  const { description, category, amount, date } = req.body;
  db.prepare('UPDATE expenses SET description=?, category=?, amount=?, date=? WHERE id=?')
    .run(description ?? existing.description, category ?? existing.category, amount ?? existing.amount, date ?? existing.date, id);
  res.json(db.prepare('SELECT * FROM expenses WHERE id = ?').get(id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM expenses WHERE id = ?').run(parseInt(req.params.id));
  if (result.changes === 0) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
