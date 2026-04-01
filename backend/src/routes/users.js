const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');

// List all users (exclude password)
router.get('/', async (req, res) => {
  try {
    const r = await db.query('SELECT id, username, name, role FROM users ORDER BY id');
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create user
router.post('/', async (req, res) => {
  try {
    const { username, password, name, role } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'username and password required' });

    const existing = await db.query('SELECT id FROM users WHERE username=$1', [username]);
    if (existing.rowCount > 0) return res.status(409).json({ message: 'Username already exists' });

    const hash = await bcrypt.hash(password, 10);
    const r = await db.query(
      'INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, username, name, role',
      [username, hash, name || username, role || 'staff']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user (name, role, optional password reset)
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await db.query('SELECT * FROM users WHERE id=$1', [id]);
    if (existing.rowCount === 0) return res.status(404).json({ message: 'Not found' });
    const user = existing.rows[0];
    const { name, role, password } = req.body;

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await db.query(
        'UPDATE users SET name=$1, role=$2, password=$3 WHERE id=$4',
        [name ?? user.name, role ?? user.role, hash, id]
      );
    } else {
      await db.query(
        'UPDATE users SET name=$1, role=$2 WHERE id=$3',
        [name ?? user.name, role ?? user.role, id]
      );
    }

    const updated = await db.query('SELECT id, username, name, role FROM users WHERE id=$1', [id]);
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete user (cannot delete yourself)
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user && req.user.id === id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    const r = await db.query('DELETE FROM users WHERE id=$1', [id]);
    if (r.rowCount === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
