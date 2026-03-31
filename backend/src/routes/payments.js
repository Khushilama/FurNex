const express = require('express');
const router = express.Router();
const db = require('../database');

const today = () => new Date().toISOString().split('T')[0];

// Recalculate order paidAmount and paymentStatus after any payment change
function syncOrderPayment(orderId) {
  const total = db.prepare('SELECT amount FROM orders WHERE id = ?').get(orderId)?.amount || 0;
  const paid = db.prepare('SELECT COALESCE(SUM(amount),0) as s FROM payments WHERE orderId = ?').get(orderId).s;
  const status = paid <= 0 ? 'Unpaid' : paid >= total ? 'Paid' : 'Partial';
  db.prepare('UPDATE orders SET paidAmount = ?, paymentStatus = ? WHERE id = ?').run(paid, status, orderId);
}

router.get('/', (req, res) => {
  const { orderId } = req.query;
  if (orderId) {
    res.json(db.prepare('SELECT * FROM payments WHERE orderId = ? ORDER BY date DESC').all(parseInt(orderId)));
  } else {
    res.json(db.prepare('SELECT * FROM payments ORDER BY date DESC').all());
  }
});

router.post('/', (req, res) => {
  const { orderId, amount, method, date, notes } = req.body;
  if (!orderId || !amount) return res.status(400).json({ message: 'orderId and amount required' });
  const result = db.prepare(
    'INSERT INTO payments (orderId, amount, method, date, notes) VALUES (?, ?, ?, ?, ?)'
  ).run(orderId, amount, method || 'Cash', date || today(), notes || '');
  syncOrderPayment(orderId);
  res.status(201).json(db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid));
});

router.delete('/:id', (req, res) => {
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(parseInt(req.params.id));
  if (!payment) return res.status(404).json({ message: 'Not found' });
  db.prepare('DELETE FROM payments WHERE id = ?').run(payment.id);
  syncOrderPayment(payment.orderId);
  res.json({ message: 'Deleted' });
});

module.exports = router;
