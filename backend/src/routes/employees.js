const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM employees ORDER BY id');
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, role } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const r = await db.query(
      'INSERT INTO employees (name, role) VALUES ($1, $2) RETURNING *',
      [name, role || '']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, role } = req.body;
    const r = await db.query(
      'UPDATE employees SET name=$1, role=$2 WHERE id=$3 RETURNING *',
      [name, role, parseInt(req.params.id)]
    );
    if (r.rowCount === 0) return res.status(404).json({ message: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await db.query('DELETE FROM employees WHERE id=$1', [parseInt(req.params.id)]);
    if (r.rowCount === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
