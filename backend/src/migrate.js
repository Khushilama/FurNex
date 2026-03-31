const db = require('./database');

db.exec(`
  CREATE TABLE IF NOT EXISTS catalog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    sellingPrice REAL DEFAULT 0,
    productionCost REAL DEFAULT 0,
    status TEXT DEFAULT 'Available'
  );
`);

// Seed if empty
const count = db.prepare('SELECT COUNT(*) as c FROM catalog').get().c;
if (count === 0) {
  const ins = db.prepare('INSERT INTO catalog (name, category, description, sellingPrice, productionCost, status) VALUES (?, ?, ?, ?, ?, ?)');
  ins.run('Dining Table', 'Tables', '6-seater solid teak dining table', 18000, 9000, 'Available');
  ins.run('Wardrobe', 'Storage', '3-door sliding wardrobe', 22000, 11000, 'Available');
  ins.run('Study Table', 'Tables', 'Single study/work table', 8500, 4000, 'Available');
  ins.run('Bed Frame', 'Beds', 'Queen size wooden bed frame', 14000, 7000, 'Available');
  ins.run('Sofa Set', 'Sofas', '3+1+1 sofa set with cushions', 35000, 18000, 'Available');
}

console.log('Migration done — catalog table ready');
