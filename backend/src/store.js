// Simple in-memory store factory
function createStore(initial = []) {
  let items = [...initial];
  let nextId = initial.length + 1;

  return {
    getAll: () => items,
    getById: (id) => items.find(i => i.id === id),
    create: (data) => {
      const item = { id: nextId++, ...data };
      items.push(item);
      return item;
    },
    update: (id, data) => {
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) return null;
      items[idx] = { ...items[idx], ...data, id };
      return items[idx];
    },
    remove: (id) => {
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) return false;
      items.splice(idx, 1);
      return true;
    },
  };
}

module.exports = { createStore };
