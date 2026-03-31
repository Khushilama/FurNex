const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Public route
app.use('/api/auth', require('./routes/auth'));

// Protected routes
app.use('/api/employees', authMiddleware, require('./routes/employees'));
app.use('/api/attendance', authMiddleware, require('./routes/attendance'));
app.use('/api/products', authMiddleware, require('./routes/products'));
app.use('/api/orders', authMiddleware, require('./routes/orders'));
app.use('/api/expenses', authMiddleware, require('./routes/expenses'));
app.use('/api/rates', authMiddleware, require('./routes/rates'));
app.use('/api/catalog', authMiddleware, require('./routes/catalog'));
app.use('/api/customers', authMiddleware, require('./routes/customers'));
app.use('/api/payroll', authMiddleware, require('./routes/payroll'));
app.use('/api/settings', authMiddleware, require('./routes/settings'));
app.use('/api/payments', authMiddleware, require('./routes/payments'));
app.use('/api/quotations', authMiddleware, require('./routes/quotations'));
app.use('/api/users', authMiddleware, require('./routes/users'));

app.get('/', (req, res) => res.json({ message: 'FurNex API running' }));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
