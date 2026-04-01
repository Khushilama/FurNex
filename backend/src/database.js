const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcryptjs');

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Initialize database schema and seed data
const initializeDatabase = async () => {
  try {
    // Create all tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        "employeeId" INTEGER NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY ("employeeId") REFERENCES employees(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS materials (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        quantity DECIMAL DEFAULT 0,
        unit TEXT DEFAULT 'pcs',
        "minStock" DECIMAL DEFAULT 0,
        "costPerUnit" DECIMAL DEFAULT 0,
        "usedQty" DECIMAL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        "customerName" TEXT NOT NULL,
        item TEXT,
        amount DECIMAL DEFAULT 0,
        status TEXT DEFAULT 'Pending',
        date TEXT,
        materials TEXT DEFAULT '[]',
        "stockDeducted" INTEGER DEFAULT 0,
        "customerId" INTEGER REFERENCES customers(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        description TEXT NOT NULL,
        category TEXT,
        amount DECIMAL DEFAULT 0,
        date TEXT
      );

      CREATE TABLE IF NOT EXISTS rates (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        "ratePerUnit" DECIMAL DEFAULT 0,
        unit TEXT,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'admin'
      );

      CREATE TABLE IF NOT EXISTS payroll (
        id SERIAL PRIMARY KEY,
        "employeeId" INTEGER NOT NULL,
        month TEXT NOT NULL,
        "baseSalary" DECIMAL DEFAULT 0,
        bonus DECIMAL DEFAULT 0,
        deduction DECIMAL DEFAULT 0,
        "netSalary" DECIMAL DEFAULT 0,
        status TEXT DEFAULT 'Pending',
        "paidOn" TEXT,
        notes TEXT,
        FOREIGN KEY ("employeeId") REFERENCES employees(id) ON DELETE CASCADE,
        UNIQUE ("employeeId", month)
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS product (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        description TEXT,
        "sellingPrice" DECIMAL DEFAULT 0,
        "productionCost" DECIMAL DEFAULT 0,
        status TEXT DEFAULT 'Available'
      );

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        "orderId" INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        amount DECIMAL DEFAULT 0,
        method TEXT DEFAULT 'Cash',
        date TEXT,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS quotations (
        id SERIAL PRIMARY KEY,
        "customerName" TEXT NOT NULL,
        "customerId" INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        items TEXT DEFAULT '[]',
        subtotal DECIMAL DEFAULT 0,
        "cgstRate" DECIMAL DEFAULT 9,
        "sgstRate" DECIMAL DEFAULT 9,
        "cgstAmount" DECIMAL DEFAULT 0,
        "sgstAmount" DECIMAL DEFAULT 0,
        "totalAmount" DECIMAL DEFAULT 0,
        status TEXT DEFAULT 'Draft',
        date TEXT,
        "validUntil" TEXT,
        notes TEXT
      );
    `);

    await pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS "paidAmount" DECIMAL DEFAULT 0;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'Unpaid';
    `);

    console.log('✓ Database schema initialized');

    // Seed initial data
    await seedDatabase();
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

// Seed database with initial data
const seedDatabase = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Check and seed employees
    const empResult = await pool.query('SELECT COUNT(*) as count FROM employees');
    if (parseInt(empResult.rows[0].count) === 0) {
      await pool.query(
        'INSERT INTO employees (name, role) VALUES ($1, $2), ($3, $4), ($5, $6)',
        ['Ravi Kumar', 'Carpenter', 'Suresh Babu', 'Polisher', 'Anita Devi', 'Helper']
      );
      console.log('✓ Employees seeded');
    }

    // Check and seed customers
    const custResult = await pool.query('SELECT COUNT(*) as count FROM customers');
    if (parseInt(custResult.rows[0].count) === 0) {
      await pool.query(
        'INSERT INTO customers (name, phone, email, address) VALUES ($1, $2, $3, $4)',
        ['Sample Customer', '9876543210', 'customer@example.com', 'Sample Address']
      );
      console.log('✓ Customers seeded');
    }

    // Check and seed materials
    const matResult = await pool.query('SELECT COUNT(*) as count FROM materials');
    if (parseInt(matResult.rows[0].count) === 0) {
      const materials = [
        ['Teak Wood', 'Wood', 50, 'kg', 20, 120, 0],
        ['Plywood Sheet', 'Wood', 8, 'sheets', 10, 850, 0],
        ['Wood Polish', 'Finish', 5, 'liters', 5, 350, 0],
        ['Screws (Box)', 'Hardware', 30, 'pcs', 10, 80, 0],
      ];
      for (const mat of materials) {
        await pool.query(
          'INSERT INTO materials (name, category, quantity, unit, "minStock", "costPerUnit", "usedQty") VALUES ($1, $2, $3, $4, $5, $6, $7)',
          mat
        );
      }
      console.log('✓ Materials seeded');
    }

    // Check and seed orders
    const ordResult = await pool.query('SELECT COUNT(*) as count FROM orders');
    if (parseInt(ordResult.rows[0].count) === 0) {
      const orders = [
        ['Raj Sharma', 'Dining Table', 18000, 'Delivered', today, '[]', 1],
        ['Priya Nair', 'Wardrobe', 22000, 'In Production', today, '[]', 0],
        ['Anil Verma', 'Study Table', 8500, 'Pending', today, '[]', 0],
        ['Meena Iyer', 'Bed Frame', 14000, 'Delivered', today, '[]', 1],
      ];
      for (const order of orders) {
        await pool.query(
          'INSERT INTO orders ("customerName", item, amount, status, date, materials, "stockDeducted") VALUES ($1, $2, $3, $4, $5, $6, $7)',
          order
        );
      }
      console.log('✓ Orders seeded');
    }

    // Check and seed expenses
    const expResult = await pool.query('SELECT COUNT(*) as count FROM expenses');
    if (parseInt(expResult.rows[0].count) === 0) {
      const expenses = [
        ['Wood purchase', 'COGS', 6000, today],
        ['Worker wages', 'Payroll', 9600, today],
        ['GST payment', 'VAT', 3760, today],
      ];
      for (const exp of expenses) {
        await pool.query(
          'INSERT INTO expenses (description, category, amount, date) VALUES ($1, $2, $3, $4)',
          exp
        );
      }
      console.log('✓ Expenses seeded');
    }

    // Check and seed rates
    const rateResult = await pool.query('SELECT COUNT(*) as count FROM rates');
    if (parseInt(rateResult.rows[0].count) === 0) {
      const rates = [
        ['Dining Table', 'Furniture', 18000, 'per piece', '6-seater teak'],
        ['Wardrobe', 'Furniture', 22000, 'per piece', '3-door sliding'],
        ['Carpenter Labour', 'Labour', 800, 'per day', ''],
        ['Polish Work', 'Labour', 1200, 'per piece', 'Full polish'],
      ];
      for (const rate of rates) {
        await pool.query(
          'INSERT INTO rates (name, category, "ratePerUnit", unit, description) VALUES ($1, $2, $3, $4, $5)',
          rate
        );
      }
      console.log('✓ Rates seeded');
    }

    // Check and seed admin user
    const userResult = await pool.query('SELECT COUNT(*) as count FROM users');
    if (parseInt(userResult.rows[0].count) === 0) {
      const hash = bcrypt.hashSync('admin123', 10);
      await pool.query(
        'INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4)',
        ['admin', hash, 'Admin', 'admin']
      );
      console.log('✓ Admin user seeded');
    }

    console.log('✓ Database seeding completed');
  } catch (err) {
    console.error('Error seeding database:', err);
  }
};

// Initialize on module load
initializeDatabase();

// Export pool for use in route handlers
module.exports = pool;
