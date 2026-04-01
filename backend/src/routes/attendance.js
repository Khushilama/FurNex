const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM attendance ORDER BY date DESC');
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { employeeId, date, status } = req.body;
    if (!employeeId || !date || !status) return res.status(400).json({ message: 'Missing fields' });
    const r = await db.query(
      'INSERT INTO attendance ("employeeId", date, status) VALUES ($1, $2, $3) RETURNING *',
      [employeeId, date, status]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
