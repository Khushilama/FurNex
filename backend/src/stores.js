const { createStore } = require('./store');

const today = new Date().toISOString().split('T')[0];

const employeesStore = createStore([
  { id: 1, name: 'Ravi Kumar', role: 'Carpenter' },
  { id: 2, name: 'Suresh Babu', role: 'Polisher' },
  { id: 3, name: 'Anita Devi', role: 'Helper' },
]);

const attendanceStore = createStore([]);

const productsStore = createStore([
  { id: 1, name: 'Teak Wood', category: 'Wood', quantity: 50, unit: 'kg', minStock: 20, costPerUnit: 120, usedQty: 0 },
  { id: 2, name: 'Plywood Sheet', category: 'Wood', quantity: 8, unit: 'sheets', minStock: 10, costPerUnit: 850, usedQty: 0 },
  { id: 3, name: 'Wood Polish', category: 'Finish', quantity: 5, unit: 'liters', minStock: 5, costPerUnit: 350, usedQty: 0 },
  { id: 4, name: 'Screws (Box)', category: 'Hardware', quantity: 30, unit: 'pcs', minStock: 10, costPerUnit: 80, usedQty: 0 },
]);

const ordersStore = createStore([
  { id: 1, customerName: 'Raj Sharma', item: 'Dining Table', amount: 18000, status: 'Delivered', date: today, materials: [] },
  { id: 2, customerName: 'Priya Nair', item: 'Wardrobe', amount: 22000, status: 'In Production', date: today, materials: [] },
  { id: 3, customerName: 'Anil Verma', item: 'Study Table', amount: 8500, status: 'Pending', date: today, materials: [] },
  { id: 4, customerName: 'Meena Iyer', item: 'Bed Frame', amount: 14000, status: 'Delivered', date: today, materials: [] },
]);

const expensesStore = createStore([
  { id: 1, description: 'Wood purchase', category: 'COGS', amount: 6000, date: today },
  { id: 2, description: 'Worker wages', category: 'Payroll', amount: 9600, date: today },
  { id: 3, description: 'GST payment', category: 'VAT', amount: 3760, date: today },
]);

const ratesStore = createStore([
  { id: 1, name: 'Dining Table', category: 'Furniture', ratePerUnit: 18000, unit: 'per piece', description: '6-seater teak' },
  { id: 2, name: 'Wardrobe', category: 'Furniture', ratePerUnit: 22000, unit: 'per piece', description: '3-door sliding' },
  { id: 3, name: 'Carpenter Labour', category: 'Labour', ratePerUnit: 800, unit: 'per day', description: '' },
  { id: 4, name: 'Polish Work', category: 'Labour', ratePerUnit: 1200, unit: 'per piece', description: 'Full polish' },
]);

module.exports = { employeesStore, attendanceStore, productsStore, ordersStore, expensesStore, ratesStore };
