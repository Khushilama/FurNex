const express = require('express');
const router = express.Router();
const db = require('../database');

const today = () => new Date().toISOString().split('T')[0];

router.get('/', async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM quotations ORDER BY id DESC');
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM quotations WHERE id=$1', [parseInt(req.params.id)]);
    if (r.rowCount === 0) return res.status(404).json({ message: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      customerName, customerId, items, subtotal,
      cgstRate, sgstRate, cgstAmount, sgstAmount, totalAmount,
      status, date, validUntil, notes,
    } = req.body;
    if (!customerName) return res.status(400).json({ message: 'customerName required' });
    const r = await db.query(
      `INSERT INTO quotations
        ("customerName", "customerId", items, subtotal, "cgstRate", "sgstRate", "cgstAmount", "sgstAmount", "totalAmount", status, date, "validUntil", notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        customerName,
        customerId || null,
        JSON.stringify(items || []),
        subtotal || 0,
        cgstRate ?? 9,
        sgstRate ?? 9,
        cgstAmount || 0,
        sgstAmount || 0,
        totalAmount || 0,
        status || 'Draft',
        date || today(),
        validUntil || null,
        notes || '',
      ]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existingR = await db.query('SELECT * FROM quotations WHERE id=$1', [id]);
    if (existingR.rowCount === 0) return res.status(404).json({ message: 'Not found' });
    const existing = existingR.rows[0];

    const {
      customerName, customerId, items, subtotal,
      cgstRate, sgstRate, cgstAmount, sgstAmount, totalAmount,
      status, date, validUntil, notes,
    } = req.body;

    const r = await db.query(
      `UPDATE quotations SET
        "customerName"=$1, "customerId"=$2, items=$3, subtotal=$4,
        "cgstRate"=$5, "sgstRate"=$6, "cgstAmount"=$7, "sgstAmount"=$8,
        "totalAmount"=$9, status=$10, date=$11, "validUntil"=$12, notes=$13
       WHERE id=$14
       RETURNING *`,
      [
        customerName ?? existing.customerName,
        customerId ?? existing.customerId,
        items !== undefined ? JSON.stringify(items) : existing.items,
        subtotal ?? existing.subtotal,
        cgstRate ?? existing.cgstRate,
        sgstRate ?? existing.sgstRate,
        cgstAmount ?? existing.cgstAmount,
        sgstAmount ?? existing.sgstAmount,
        totalAmount ?? existing.totalAmount,
        status ?? existing.status,
        date ?? existing.date,
        validUntil ?? existing.validUntil,
        notes ?? existing.notes,
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
    const r = await db.query('DELETE FROM quotations WHERE id=$1', [parseInt(req.params.id)]);
    if (r.rowCount === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
