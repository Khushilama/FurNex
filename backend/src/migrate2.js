const db = require('./database');

// Settings table (key-value store)
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId INTEGER NOT NULL,
    amount REAL NOT NULL,
    method TEXT DEFAULT 'Cash',
    date TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS quotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customerName TEXT NOT NULL,
    customerId INTEGER,
    items TEXT DEFAULT '[]',
    subtotal REAL DEFAULT 0,
    cgstRate REAL DEFAULT 9,
    sgstRate REAL DEFAULT 9,
    cgstAmount REAL DEFAULT 0,
    sgstAmount REAL DEFAULT 0,
    totalAmount REAL DEFAULT 0,
    status TEXT DEFAULT 'Draft',
    date TEXT,
    validUntil TEXT,
    notes TEXT,
    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE SET NULL
  );
`);

// Add payment columns to orders if missing
const orderCols = db.prepare('PRAGMA table_info(orders)').all().map(c => c.name);
if (!orderCols.includes('advanceAmount')) db.exec('ALTER TABLE orders ADD COLUMN advanceAmount REAL DEFAULT 0');
if (!orderCols.includes('paidAmount'))    db.exec('ALTER TABLE orders ADD COLUMN paidAmount REAL DEFAULT 0');
if (!orderCols.includes('paymentStatus')) db.exec('ALTER TABLE orders ADD COLUMN paymentStatus TEXT DEFAULT "Unpaid"');

// Seed default settings
const defaults = {
  businessName:    'FurNex Furniture Workshop',
  businessAddress: '123 Workshop Road, Industrial Area',
  businessPhone:   '+91 98765 43210',
  businessEmail:   'info@furnex.com',
  businessGST:     '',
  cgstRate:        '9',
  sgstRate:        '9',
  currency:        'Rs',
  invoicePrefix:   'INV',
};
const ins = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
Object.entries(defaults).forEach(([k, v]) => ins.run(k, v));

console.log('Migration 2 done — settings, payments, quotations ready');
