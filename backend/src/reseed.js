const db = require('./database');

// Clear existing materials and catalog
db.prepare('DELETE FROM materials').run();
db.prepare("DELETE FROM sqlite_sequence WHERE name = 'materials'").run();
db.prepare('DELETE FROM product').run();
db.prepare("DELETE FROM sqlite_sequence WHERE name = 'product'").run();

// ── MATERIALS (raw inputs for making furniture) ──────────────────────────────
const insMat = db.prepare(
  'INSERT INTO materials (name, category, quantity, unit, minStock, costPerUnit, usedQty) VALUES (?, ?, ?, ?, ?, ?, 0)'
);

const materials = [
  // Wood
  ['Teak Wood',         'Wood',      200,  'kg',     50,  180],
  ['Sheesham Wood',     'Wood',      150,  'kg',     40,  150],
  ['Plywood (18mm)',    'Wood',       60,  'sheets', 15,  950],
  ['Plywood (12mm)',    'Wood',       40,  'sheets', 10,  750],
  ['MDF Board',         'Wood',       30,  'sheets', 10,  600],
  ['Blockboard',        'Wood',       25,  'sheets', 8,   850],

  // Finish & Polish
  ['Wood Varnish',      'Finish',     20,  'liters', 5,   320],
  ['Wood Polish',       'Finish',     15,  'liters', 5,   280],
  ['Wood Stain',        'Finish',     10,  'liters', 3,   350],
  ['Wood Primer',       'Finish',     12,  'liters', 3,   220],
  ['Sandpaper (80)',    'Finish',    100,  'pcs',    20,   12],
  ['Sandpaper (180)',   'Finish',    100,  'pcs',    20,    8],

  // Hardware
  ['Screws Assorted',   'Hardware',   50,  'boxes',  10,   85],
  ['Nails Assorted',    'Hardware',   30,  'boxes',  8,    60],
  ['Wood Glue',         'Hardware',   20,  'liters', 5,   180],
  ['Hinges (pair)',     'Hardware',  200,  'pcs',    40,   35],
  ['Drawer Slides',     'Hardware',   80,  'pairs',  20,  120],
  ['Cabinet Handles',   'Hardware',  150,  'pcs',    30,   45],
  ['Door Knobs',        'Hardware',  100,  'pcs',    20,   55],
  ['L-Brackets',        'Hardware',  200,  'pcs',    50,   18],

  // Fabric & Foam
  ['Upholstery Fabric', 'Fabric',    100,  'meters', 20,  180],
  ['Foam (High Density)','Fabric',    50,  'kg',     10,  320],
  ['Foam (Medium)',     'Fabric',     40,  'kg',     10,  240],
  ['Rexine Leather',    'Fabric',     60,  'meters', 15,  220],

  // Glass & Mirror
  ['Glass Sheet (5mm)', 'Glass',      20,  'sheets', 5,  1200],
  ['Mirror Sheet',      'Glass',      15,  'sheets', 4,  1400],
];

materials.forEach(m => insMat.run(...m));
console.log(`✓ ${materials.length} materials seeded`);

// ── PRODUCTS / CATALOG (finished furniture items) ────────────────────────────
const insProd = db.prepare(
  'INSERT INTO product (name, category, description, sellingPrice, productionCost, status) VALUES (?, ?, ?, ?, ?, ?)'
);

const catalog = [
  // Dining
  ['Dining Table (4-Seater)',  'Dining',   'Solid teak 4-seater dining table',         12000,  6000, 'Available'],
  ['Dining Table (6-Seater)',  'Dining',   'Solid teak 6-seater dining table',         18000,  9000, 'Available'],
  ['Dining Chair',             'Dining',   'Teak wood dining chair with cushion',        2500,  1200, 'Available'],
  ['Dining Set (4-Seater)',    'Dining',   'Table + 4 chairs complete set',             22000, 11000, 'Available'],
  ['Dining Set (6-Seater)',    'Dining',   'Table + 6 chairs complete set',             32000, 16000, 'Available'],

  // Beds
  ['Single Bed',               'Beds',     'Single size wooden bed frame',               8000,  4000, 'Available'],
  ['Double Bed',               'Beds',     'Double size wooden bed frame',              12000,  6000, 'Available'],
  ['Queen Size Bed',           'Beds',     'Queen size bed with headboard',             16000,  8000, 'Available'],
  ['King Size Bed',            'Beds',     'King size bed with carved headboard',       22000, 11000, 'Available'],
  ['Bunk Bed',                 'Beds',     'Double decker bunk bed for kids',           14000,  7000, 'Available'],

  // Storage
  ['2-Door Wardrobe',          'Storage',  '2-door sliding wardrobe with mirror',       16000,  8000, 'Available'],
  ['3-Door Wardrobe',          'Storage',  '3-door sliding wardrobe',                   22000, 11000, 'Available'],
  ['4-Door Wardrobe',          'Storage',  '4-door wardrobe with drawers',              28000, 14000, 'Available'],
  ['Cupboard (Small)',         'Storage',  'Small wooden storage cupboard',              7000,  3500, 'Available'],
  ['Chest of Drawers',         'Storage',  '5-drawer solid wood chest',                 9000,  4500, 'Available'],
  ['Bookshelf',                'Storage',  '5-tier wooden bookshelf',                   6000,  3000, 'Available'],
  ['TV Unit',                  'Storage',  'Wooden TV stand with cabinet',              8500,  4200, 'Available'],
  ['Shoe Rack',                'Storage',  '4-tier wooden shoe rack',                   3500,  1600, 'Available'],

  // Sofas & Seating
  ['1-Seater Sofa',            'Sofas',    'Single seater fabric sofa',                 6000,  3000, 'Available'],
  ['2-Seater Sofa',            'Sofas',    '2-seater fabric sofa',                      9000,  4500, 'Available'],
  ['3-Seater Sofa',            'Sofas',    '3-seater fabric sofa',                     12000,  6000, 'Available'],
  ['Sofa Set (3+1+1)',         'Sofas',    'Complete sofa set with cushions',           26000, 13000, 'Available'],
  ['L-Shape Sofa',             'Sofas',    'Corner L-shape sofa',                      32000, 16000, 'Available'],

  // Tables
  ['Center Table',             'Tables',   'Wooden center/coffee table',                4500,  2200, 'Available'],
  ['Study Table',              'Tables',   'Study/work table with drawer',              6500,  3200, 'Available'],
  ['Computer Table',           'Tables',   'Computer desk with keyboard tray',          7500,  3700, 'Available'],
  ['Dressing Table',           'Tables',   'Dressing table with mirror',                9000,  4500, 'Available'],
  ['Side Table',               'Tables',   'Wooden bedside table',                      3000,  1400, 'Available'],
  ['Folding Table',            'Tables',   'Foldable wooden table',                     4000,  1900, 'Available'],

  // Chairs
  ['Office Chair',             'Chairs',   'Cushioned wooden office chair',             4500,  2200, 'Available'],
  ['Rocking Chair',            'Chairs',   'Solid wood rocking chair',                  7000,  3500, 'Available'],
  ['Kids Chair',               'Chairs',   'Small wooden chair for kids',               2000,   900, 'Available'],
];

catalog.forEach(c => insProd.run(...c));
console.log(`✓ ${catalog.length} products seeded`);

console.log('\nReseed complete!');
