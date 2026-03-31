let items = [
  { id: 1, name: 'Item One', description: 'First item' },
  { id: 2, name: 'Item Two', description: 'Second item' },
];

let nextId = 3;

const getAll = (req, res) => {
  res.json(items);
};

const getById = (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ message: 'Item not found' });
  res.json(item);
};

const create = (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });
  const newItem = { id: nextId++, name, description };
  items.push(newItem);
  res.status(201).json(newItem);
};

const update = (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ message: 'Item not found' });
  const { name, description } = req.body;
  if (name) item.name = name;
  if (description) item.description = description;
  res.json(item);
};

const remove = (req, res) => {
  const index = items.findIndex(i => i.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Item not found' });
  items.splice(index, 1);
  res.json({ message: 'Item deleted' });
};

module.exports = { getAll, getById, create, update, remove };
