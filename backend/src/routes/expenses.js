const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM expenses ORDER BY date DESC');
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { description, category, amount, date } = req.body;
    if (!description || !amount) return res.status(400).json({ message: 'Missing fields' });
    const r = await db.query(
      'INSERT INTO expenses (description, category, amount, date) VALUES ($1, $2, $3, $4) RETURNING *',
      [description, category || 'Other', amount, date || new Date().toISOString().split('T')[0]]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await db.query('SELECT * FROM expenses WHERE id=$1', [id]);
    if (existing.rowCount === 0) return res.status(404).json({ message: 'Not found' });
    const ex = existing.rows[0];
    const { description, category, amount, date } = req.body;
    const r = await db.query(
      'UPDATE expenses SET description=$1, category=$2, amount=$3, date=$4 WHERE id=$5 RETURNING *',
      [
        description ?? ex.description,
        category ?? ex.category,
        amount ?? ex.amount,
        date ?? ex.date,
        id,
      ]
    );
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await db.query('DELETE FROM expenses WHERE id=$1', [parseInt(req.params.id)]);
    if (r.rowCount === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
