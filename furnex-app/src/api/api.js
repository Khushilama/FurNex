import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const client = axios.create({ baseURL: BASE });

// Attach token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('furnex_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('furnex_token');
      localStorage.removeItem('furnex_user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (data) => axios.post(`${BASE}/auth/login`, data),
  changePassword: (data) => axios.post(`${BASE}/auth/change-password`, data),
};

export const api = {
  getEmployees: () => client.get('/employees'),
  addEmployee: (data) => client.post('/employees', data),
  deleteEmployee: (id) => client.delete(`/employees/${id}`),

  getAttendance: () => client.get('/attendance'),
  markAttendance: (data) => client.post('/attendance', data),

  getProducts: () => client.get('/products'),
  addProduct: (data) => client.post('/products', data),
  updateProduct: (id, data) => client.put(`/products/${id}`, data),
  deleteProduct: (id) => client.delete(`/products/${id}`),

  getOrders: () => client.get('/orders'),
  addOrder: (data) => client.post('/orders', data),
  updateOrder: (id, data) => client.put(`/orders/${id}`, data),
  deleteOrder: (id) => client.delete(`/orders/${id}`),

  getExpenses: () => client.get('/expenses'),
  addExpense: (data) => client.post('/expenses', data),
  updateExpense: (id, data) => client.put(`/expenses/${id}`, data),
  deleteExpense: (id) => client.delete(`/expenses/${id}`),

  getRates: () => client.get('/rates'),
  addRate: (data) => client.post('/rates', data),
  updateRate: (id, data) => client.put(`/rates/${id}`, data),
  deleteRate: (id) => client.delete(`/rates/${id}`),

  getCatalog: () => client.get('/catalog'),
  addCatalogItem: (data) => client.post('/catalog', data),
  updateCatalogItem: (id, data) => client.put(`/catalog/${id}`, data),
  deleteCatalogItem: (id) => client.delete(`/catalog/${id}`),

  getCustomers: () => client.get('/customers'),
  addCustomer: (data) => client.post('/customers', data),
  updateCustomer: (id, data) => client.put(`/customers/${id}`, data),
  deleteCustomer: (id) => client.delete(`/customers/${id}`),

  getPayroll: (month) => client.get(month ? `/payroll?month=${month}` : '/payroll'),
  addPayrollRecord: (data) => client.post('/payroll', data),
  updatePayrollRecord: (id, data) => client.put(`/payroll/${id}`, data),
  deletePayrollRecord: (id) => client.delete(`/payroll/${id}`),

  getSettings: () => client.get('/settings'),
  updateSettings: (data) => client.put('/settings', data),

  getPayments: (orderId) => client.get(orderId ? `/payments?orderId=${orderId}` : '/payments'),
  addPayment: (data) => client.post('/payments', data),
  deletePayment: (id) => client.delete(`/payments/${id}`),

  getQuotations: () => client.get('/quotations'),
  addQuotation: (data) => client.post('/quotations', data),
  updateQuotation: (id, data) => client.put(`/quotations/${id}`, data),
  deleteQuotation: (id) => client.delete(`/quotations/${id}`),

  getUsers: () => client.get('/users'),
  addUser: (data) => client.post('/users', data),
  updateUser: (id, data) => client.put(`/users/${id}`, data),
  deleteUser: (id) => client.delete(`/users/${id}`),
};
