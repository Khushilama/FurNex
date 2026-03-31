const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');

// List all users (exclude password)
router.get('/', (req, res) => {
  res.json(db.prepare('SELECT id, username, name, role FROM users ORDER BY id').all());
});

// Create user (admin only)
router.post('/', (req, res) => {
  const { username, password, name, role } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'username and password required' });
  if (db.prepare('SELECT id FROM users WHERE username = ?').get(username)) {
    return res.status(409).json({ message: 'Username already exists' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)'
  ).run(username, hash, name || username, role || 'staff');
  res.status(201).json({ id: result.lastInsertRowid, username, name: name || username, role: role || 'staff' });
});

// Update user (name, role, optional password reset)
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ message: 'Not found' });
  const { name, role, password } = req.body;
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET name=?, role=?, password=? WHERE id=?').run(name ?? user.name, role ?? user.role, hash, id);
  } else {
    db.prepare('UPDATE users SET name=?, role=? WHERE id=?').run(name ?? user.name, role ?? user.role, id);
  }
  const updated = db.prepare('SELECT id, username, name, role FROM users WHERE id = ?').get(id);
  res.json(updated);
});

// Delete user (cannot delete yourself)
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (req.user && req.user.id === id) {
    return res.status(400).json({ message: 'Cannot delete your own account' });
  }
  if (!db.prepare('SELECT id FROM users WHERE id = ?').get(id)) {
    return res.status(404).json({ message: 'Not found' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
