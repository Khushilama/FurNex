const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

    const r = await db.query('SELECT * FROM users WHERE username=$1', [username]);
    const user = r.rows[0];
    if (!user) return res.status(401).json({ message: 'Invalid username or password' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid username or password' });

    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Change password
router.post('/change-password', async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;
    const r = await db.query('SELECT * FROM users WHERE username=$1', [username]);
    const user = r.rows[0];
    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password=$1 WHERE username=$2', [hash, username]);
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
