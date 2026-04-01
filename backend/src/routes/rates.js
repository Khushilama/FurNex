const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM rates');
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, category, ratePerUnit, unit, description } = req.body;
    if (!name || !ratePerUnit) return res.status(400).json({ message: 'Missing fields' });
    const r = await db.query(
      'INSERT INTO rates (name, category, "ratePerUnit", unit, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, category || '', ratePerUnit, unit || 'per piece', description || '']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, category, ratePerUnit, unit, description } = req.body;
    const r = await db.query(
      'UPDATE rates SET name=$1, category=$2, "ratePerUnit"=$3, unit=$4, description=$5 WHERE id=$6 RETURNING *',
      [name, category, ratePerUnit, unit, description, parseInt(req.params.id)]
    );
    if (r.rowCount === 0) return res.status(404).json({ message: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await db.query('DELETE FROM rates WHERE id=$1', [parseInt(req.params.id)]);
    if (r.rowCount === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
