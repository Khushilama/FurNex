const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM product').all());
});

router.post('/', (req, res) => {
  const { name, category, description, sellingPrice, productionCost, status } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });
  const result = db.prepare(
    'INSERT INTO product (name, category, description, sellingPrice, productionCost, status) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, category || '', description || '', sellingPrice || 0, productionCost || 0, status || 'Available');
  res.status(201).json(db.prepare('SELECT * FROM product WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const { name, category, description, sellingPrice, productionCost, status } = req.body;
  const result = db.prepare(
    'UPDATE product SET name=?, category=?, description=?, sellingPrice=?, productionCost=?, status=? WHERE id=?'
  ).run(name, category, description, sellingPrice, productionCost, status, parseInt(req.params.id));
  if (result.changes === 0) return res.status(404).json({ message: 'Not found' });
  res.json(db.prepare('SELECT * FROM product WHERE id = ?').get(parseInt(req.params.id)));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM product WHERE id = ?').run(parseInt(req.params.id));
  if (result.changes === 0) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
