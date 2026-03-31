import React, { useState } from 'react';
import { authApi } from '../api/api';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(form);
      localStorage.setItem('furnex_token', res.data.token);
      localStorage.setItem('furnex_user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <span style={styles.logo}>FurNex</span>
        </div>
        <p style={styles.tagline}>Workshop Management System</p>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Enter username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              autoFocus
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={styles.hint}>Default: <strong>admin</strong> / <strong>admin123</strong></p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '40px 36px',
    width: 380,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  logoRow: {
    textAlign: 'center',
    marginBottom: 6,
  },
  logo: {
    fontSize: 32,
    fontWeight: 800,
    color: '#f5a623',
    letterSpacing: 2,
  },
  tagline: {
    textAlign: 'center',
    color: '#888',
    fontSize: 13,
    marginBottom: 28,
  },
  field: {
    marginBottom: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#444',
  },
  input: {
    padding: '10px 14px',
    border: '1.5px solid #e0e0e0',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    transition: 'border 0.2s',
  },
  error: {
    background: '#fde8e8',
    color: '#e74c3c',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    marginBottom: 14,
  },
  btn: {
    width: '100%',
    padding: '12px',
    background: '#f5a623',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  hint: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
    color: '#aaa',
  },
};
