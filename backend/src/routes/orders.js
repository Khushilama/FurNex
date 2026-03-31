const express = require('express');
const router = express.Router();
const db = require('../database');

const today = new Date().toISOString().split('T')[0];

function deductStock(materials = []) {
  const update = db.prepare('UPDATE materials SET quantity = MAX(0, quantity - ?), usedQty = usedQty + ? WHERE id = ?');
  materials.forEach(({ productId, qty }) => {
    update.run(Number(qty), Number(qty), productId);
  });
}

const parseOrder = (o) => ({
  ...o,
  materials: JSON.parse(o.materials || '[]'),
  stockDeducted: !!o.stockDeducted,
});

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM orders ORDER BY id DESC').all().map(parseOrder));
});

router.post('/', (req, res) => {
  const { customerName, customerId, item, amount, status, date, materials } = req.body;

  // If customerId given, auto-fill customerName from customers table
  let resolvedName = customerName;
  if (customerId) {
    const customer = db.prepare('SELECT name FROM customers WHERE id = ?').get(customerId);
    if (customer) resolvedName = customer.name;
  }
  if (!resolvedName || !amount) return res.status(400).json({ message: 'Missing fields' });

  const newStatus = status || 'Pending';
  const matsJson = JSON.stringify(materials || []);
  const stockDeducted = newStatus === 'Delivered' ? 1 : 0;

  const result = db.prepare(
    'INSERT INTO orders (customerName, customerId, item, amount, status, date, materials, stockDeducted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(resolvedName, customerId || null, item || '', amount, newStatus, date || today, matsJson, stockDeducted);

  if (newStatus === 'Delivered') deductStock(materials || []);

  res.status(201).json(parseOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid)));
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ message: 'Not found' });

  const { customerName, customerId, item, amount, status, date, materials } = req.body;
  const newStatus = status || existing.status;
  const matsJson = materials !== undefined ? JSON.stringify(materials) : existing.materials;

  let stockDeducted = existing.stockDeducted;
  if (newStatus === 'Delivered' && existing.status !== 'Delivered' && !existing.stockDeducted) {
    deductStock(JSON.parse(existing.materials || '[]'));
    stockDeducted = 1;
  }

  db.prepare(
    'UPDATE orders SET customerName=?, customerId=?, item=?, amount=?, status=?, date=?, materials=?, stockDeducted=? WHERE id=?'
  ).run(
    customerName || existing.customerName,
    customerId !== undefined ? customerId : existing.customerId,
    item || existing.item,
    amount || existing.amount,
    newStatus,
    date || existing.date,
    matsJson,
    stockDeducted,
    id
  );

  res.json(parseOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(id)));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM orders WHERE id = ?').run(parseInt(req.params.id));
  if (result.changes === 0) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
