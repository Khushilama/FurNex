const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM attendance ORDER BY date DESC').all());
});

router.post('/', (req, res) => {
  const { employeeId, date, status } = req.body;
  if (!employeeId || !date || !status) return res.status(400).json({ message: 'Missing fields' });
  const result = db.prepare('INSERT INTO attendance (employeeId, date, status) VALUES (?, ?, ?)').run(employeeId, date, status);
  res.status(201).json({ id: result.lastInsertRowid, employeeId, date, status });
});

module.exports = router;
