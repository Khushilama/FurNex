const express = require('express');
const router = express.Router();
const db = require('../database');

const today = () => new Date().toISOString().split('T')[0];

async function deductStock(materials = []) {
  for (const { productId, qty } of materials) {
    await db.query(
      'UPDATE materials SET quantity = GREATEST(0, quantity - $1), "usedQty" = "usedQty" + $2 WHERE id = $3',
      [Number(qty), Number(qty), productId]
    );
  }
}

const parseOrder = (o) => ({
  ...o,
  materials: JSON.parse(o.materials || '[]'),
  stockDeducted: !!o.stockDeducted,
});

router.get('/', async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM orders ORDER BY id DESC');
    res.json(r.rows.map(parseOrder));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { customerName, customerId, item, amount, status, date, materials } = req.body;

    let resolvedName = customerName;
    if (customerId) {
      const custR = await db.query('SELECT name FROM customers WHERE id=$1', [customerId]);
      if (custR.rows[0]) resolvedName = custR.rows[0].name;
    }
    if (!resolvedName || !amount) return res.status(400).json({ message: 'Missing fields' });

    const newStatus = status || 'Pending';
    const matsJson = JSON.stringify(materials || []);
    const stockDeducted = newStatus === 'Delivered' ? 1 : 0;

    const r = await db.query(
      'INSERT INTO orders ("customerName", "customerId", item, amount, status, date, materials, "stockDeducted") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [resolvedName, customerId || null, item || '', amount, newStatus, date || today(), matsJson, stockDeducted]
    );

    if (newStatus === 'Delivered') await deductStock(materials || []);

    res.status(201).json(parseOrder(r.rows[0]));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existingR = await db.query('SELECT * FROM orders WHERE id=$1', [id]);
    if (existingR.rowCount === 0) return res.status(404).json({ message: 'Not found' });
    const existing = existingR.rows[0];

    const { customerName, customerId, item, amount, status, date, materials } = req.body;
    const newStatus = status || existing.status;
    const matsJson = materials !== undefined ? JSON.stringify(materials) : existing.materials;

    let stockDeducted = existing.stockDeducted;
    if (newStatus === 'Delivered' && existing.status !== 'Delivered' && !existing.stockDeducted) {
      await deductStock(JSON.parse(existing.materials || '[]'));
      stockDeducted = 1;
    }

    const r = await db.query(
      'UPDATE orders SET "customerName"=$1, "customerId"=$2, item=$3, amount=$4, status=$5, date=$6, materials=$7, "stockDeducted"=$8 WHERE id=$9 RETURNING *',
      [
        customerName || existing.customerName,
        customerId !== undefined ? customerId : existing.customerId,
        item || existing.item,
        amount || existing.amount,
        newStatus,
        date || existing.date,
        matsJson,
        stockDeducted,
        id,
      ]
    );

    res.json(parseOrder(r.rows[0]));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await db.query('DELETE FROM orders WHERE id=$1', [parseInt(req.params.id)]);
    if (r.rowCount === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
