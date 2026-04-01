const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM materials');
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, category, quantity, unit, minStock, costPerUnit, usedQty } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const r = await db.query(
      'INSERT INTO materials (name, category, quantity, unit, "minStock", "costPerUnit", "usedQty") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, category || '', quantity || 0, unit || 'pcs', minStock || 0, costPerUnit || 0, usedQty || 0]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, category, quantity, unit, minStock, costPerUnit, usedQty } = req.body;
    const r = await db.query(
      'UPDATE materials SET name=$1, category=$2, quantity=$3, unit=$4, "minStock"=$5, "costPerUnit"=$6, "usedQty"=$7 WHERE id=$8 RETURNING *',
      [name, category, quantity, unit, minStock, costPerUnit, usedQty, parseInt(req.params.id)]
    );
    if (r.rowCount === 0) return res.status(404).json({ message: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await db.query('DELETE FROM materials WHERE id=$1', [parseInt(req.params.id)]);
    if (r.rowCount === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
