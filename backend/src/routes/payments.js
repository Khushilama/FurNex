const express = require('express');
const router = express.Router();
const db = require('../database');

const today = () => new Date().toISOString().split('T')[0];

// Recalculate order paidAmount and paymentStatus after any payment change
async function syncOrderPayment(orderId) {
  const orderR = await db.query('SELECT amount FROM orders WHERE id=$1', [orderId]);
  const total = orderR.rows[0]?.amount || 0;
  const paidR = await db.query('SELECT COALESCE(SUM(amount), 0) AS s FROM payments WHERE "orderId"=$1', [orderId]);
  const paid = Number(paidR.rows[0].s);
  const status = paid <= 0 ? 'Unpaid' : paid >= total ? 'Paid' : 'Partial';
  await db.query('UPDATE orders SET "paidAmount"=$1, "paymentStatus"=$2 WHERE id=$3', [paid, status, orderId]);
}

router.get('/', async (req, res) => {
  try {
    const { orderId } = req.query;
    if (orderId) {
      const r = await db.query('SELECT * FROM payments WHERE "orderId"=$1 ORDER BY date DESC', [parseInt(orderId)]);
      res.json(r.rows);
    } else {
      const r = await db.query('SELECT * FROM payments ORDER BY date DESC');
      res.json(r.rows);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { orderId, amount, method, date, notes } = req.body;
    if (!orderId || !amount) return res.status(400).json({ message: 'orderId and amount required' });
    const r = await db.query(
      'INSERT INTO payments ("orderId", amount, method, date, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [orderId, amount, method || 'Cash', date || today(), notes || '']
    );
    await syncOrderPayment(orderId);
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const paymentR = await db.query('SELECT * FROM payments WHERE id=$1', [parseInt(req.params.id)]);
    if (paymentR.rowCount === 0) return res.status(404).json({ message: 'Not found' });
    const payment = paymentR.rows[0];
    await db.query('DELETE FROM payments WHERE id=$1', [payment.id]);
    await syncOrderPayment(payment.orderId);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
