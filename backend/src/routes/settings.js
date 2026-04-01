const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', async (req, res) => {
  try {
    const r = await db.query('SELECT key, value FROM settings');
    const settings = Object.fromEntries(r.rows.map(row => [row.key, row.value]));
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const entries = Object.entries(req.body);
    for (const [k, v] of entries) {
      await db.query(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
        [k, String(v)]
      );
    }
    const r = await db.query('SELECT key, value FROM settings');
    res.json(Object.fromEntries(r.rows.map(row => [row.key, row.value])));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
