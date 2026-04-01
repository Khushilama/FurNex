const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM product');
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, category, description, sellingPrice, productionCost, status } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const r = await db.query(
      'INSERT INTO product (name, category, description, "sellingPrice", "productionCost", status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, category || '', description || '', sellingPrice || 0, productionCost || 0, status || 'Available']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, category, description, sellingPrice, productionCost, status } = req.body;
    const r = await db.query(
      'UPDATE product SET name=$1, category=$2, description=$3, "sellingPrice"=$4, "productionCost"=$5, status=$6 WHERE id=$7 RETURNING *',
      [name, category, description, sellingPrice, productionCost, status, parseInt(req.params.id)]
    );
    if (r.rowCount === 0) return res.status(404).json({ message: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await db.query('DELETE FROM product WHERE id=$1', [parseInt(req.params.id)]);
    if (r.rowCount === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
