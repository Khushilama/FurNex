const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'furnex.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    quantity REAL DEFAULT 0,
    unit TEXT DEFAULT 'pcs',
    minStock REAL DEFAULT 0,
    costPerUnit REAL DEFAULT 0,
    usedQty REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customerName TEXT NOT NULL,
    item TEXT,
    amount REAL DEFAULT 0,
    status TEXT DEFAULT 'Pending',
    date TEXT,
    materials TEXT DEFAULT '[]',
    stockDeducted INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    category TEXT,
    amount REAL DEFAULT 0,
    date TEXT
  );

  CREATE TABLE IF NOT EXISTS rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    ratePerUnit REAL DEFAULT 0,
    unit TEXT,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'admin'
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    createdAt TEXT DEFAULT (date('now'))
  );

  CREATE TABLE IF NOT EXISTS payroll (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId INTEGER NOT NULL,
    month TEXT NOT NULL,
    baseSalary REAL DEFAULT 0,
    bonus REAL DEFAULT 0,
    deduction REAL DEFAULT 0,
    netSalary REAL DEFAULT 0,
    status TEXT DEFAULT 'Pending',
    paidOn TEXT,
    notes TEXT,
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE (employeeId, month)
  );
`);

// Add customerId to orders if not exists (migration)
const orderCols = db.prepare('PRAGMA table_info(orders)').all().map(c => c.name);
if (!orderCols.includes('customerId')) {
  db.exec('ALTER TABLE orders ADD COLUMN customerId INTEGER REFERENCES customers(id) ON DELETE SET NULL');
}

// Seed initial data if tables are empty
const seedIfEmpty = (table, insertFn, rows) => {
  const count = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get().c;
  if (count === 0) rows.forEach(insertFn);
};

const today = new Date().toISOString().split('T')[0];

seedIfEmpty('employees',
  (r) => db.prepare('INSERT INTO employees (name, role) VALUES (?, ?)').run(r.name, r.role),
  [
    { name: 'Ravi Kumar', role: 'Carpenter' },
    { name: 'Suresh Babu', role: 'Polisher' },
    { name: 'Anita Devi', role: 'Helper' },
  ]
);

seedIfEmpty('materials',
  (r) => db.prepare('INSERT INTO materials (name, category, quantity, unit, minStock, costPerUnit, usedQty) VALUES (?, ?, ?, ?, ?, ?, ?)').run(r.name, r.category, r.quantity, r.unit, r.minStock, r.costPerUnit, r.usedQty),
  [
    { name: 'Teak Wood', category: 'Wood', quantity: 50, unit: 'kg', minStock: 20, costPerUnit: 120, usedQty: 0 },
    { name: 'Plywood Sheet', category: 'Wood', quantity: 8, unit: 'sheets', minStock: 10, costPerUnit: 850, usedQty: 0 },
    { name: 'Wood Polish', category: 'Finish', quantity: 5, unit: 'liters', minStock: 5, costPerUnit: 350, usedQty: 0 },
    { name: 'Screws (Box)', category: 'Hardware', quantity: 30, unit: 'pcs', minStock: 10, costPerUnit: 80, usedQty: 0 },
  ]
);

seedIfEmpty('orders',
  (r) => db.prepare('INSERT INTO orders (customerName, item, amount, status, date, materials, stockDeducted) VALUES (?, ?, ?, ?, ?, ?, ?)').run(r.customerName, r.item, r.amount, r.status, r.date, r.materials, r.stockDeducted),
  [
    { customerName: 'Raj Sharma', item: 'Dining Table', amount: 18000, status: 'Delivered', date: today, materials: '[]', stockDeducted: 1 },
    { customerName: 'Priya Nair', item: 'Wardrobe', amount: 22000, status: 'In Production', date: today, materials: '[]', stockDeducted: 0 },
    { customerName: 'Anil Verma', item: 'Study Table', amount: 8500, status: 'Pending', date: today, materials: '[]', stockDeducted: 0 },
    { customerName: 'Meena Iyer', item: 'Bed Frame', amount: 14000, status: 'Delivered', date: today, materials: '[]', stockDeducted: 1 },
  ]
);

seedIfEmpty('expenses',
  (r) => db.prepare('INSERT INTO expenses (description, category, amount, date) VALUES (?, ?, ?, ?)').run(r.description, r.category, r.amount, r.date),
  [
    { description: 'Wood purchase', category: 'COGS', amount: 6000, date: today },
    { description: 'Worker wages', category: 'Payroll', amount: 9600, date: today },
    { description: 'GST payment', category: 'VAT', amount: 3760, date: today },
  ]
);

seedIfEmpty('rates',
  (r) => db.prepare('INSERT INTO rates (name, category, ratePerUnit, unit, description) VALUES (?, ?, ?, ?, ?)').run(r.name, r.category, r.ratePerUnit, r.unit, r.description),
  [
    { name: 'Dining Table', category: 'Furniture', ratePerUnit: 18000, unit: 'per piece', description: '6-seater teak' },
    { name: 'Wardrobe', category: 'Furniture', ratePerUnit: 22000, unit: 'per piece', description: '3-door sliding' },
    { name: 'Carpenter Labour', category: 'Labour', ratePerUnit: 800, unit: 'per day', description: '' },
    { name: 'Polish Work', category: 'Labour', ratePerUnit: 1200, unit: 'per piece', description: 'Full polish' },
  ]
);

// Seed default admin user if no users exist
const bcrypt = require('bcryptjs');
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (userCount === 0) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)').run('admin', hash, 'Admin', 'admin');
}

module.exports = db;
