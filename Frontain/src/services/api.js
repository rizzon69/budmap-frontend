import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('budmap_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
// Only redirect to login on 401 if the user was actually logged in (had a token)
// This prevents the register page from being kicked to /login when public endpoints
// return 401 (e.g. departments fetch before the user has an account)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const hadToken = !!localStorage.getItem('budmap_token');
    const is401 = error.response?.status === 401;
    const isPublicRoute = ['/register', '/login', '/forgot', '/reset-password', '/verify-email']
      .some(route => window.location.pathname.startsWith(route));

    if (is401 && hadToken && !isPublicRoute) {
      localStorage.removeItem('budmap_token');
      localStorage.removeItem('budmap_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Registration / Verification API
export const registrationAPI = {
  verifyEmail: (token) => api.get(`/registration/verify-email/${token}`),
  resendVerification: (email) => api.post('/registration/resend-verification', { email }),
};

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/password', data),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getByOrganization: (orgId) => api.get(`/users/organization/${orgId}`),
};

// Organizations API
export const organizationsAPI = {
  getAll: (params) => api.get('/organizations', { params }),
  getPublic: () => api.get('/organizations/public'), // no auth required
  getById: (id) => api.get(`/organizations/${id}`),
  create: (data) => api.post('/organizations', data),
  update: (id, data) => api.put(`/organizations/${id}`, data),
  delete: (id) => api.delete(`/organizations/${id}`),
  getTypes: () => api.get('/organizations/meta/types'),
};

// Budgets API
export const budgetsAPI = {
  getAll: (params) => api.get('/budgets', { params }),
  getById: (id) => api.get(`/budgets/${id}`),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
  approve: (id) => api.post(`/budgets/${id}/approve`),
  getCategories: (params) => api.get('/budgets/meta/categories', { params }),
  getSummary: (params) => api.get('/budgets/stats/summary', { params }),
};

// Transactions API
export const transactionsAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  approve: (id) => api.post(`/transactions/${id}/approve`),
  reject: (id) => api.post(`/transactions/${id}/reject`),
  getStats: (params) => api.get('/transactions/stats/summary', { params }),
};

// Departments API
export const departmentsAPI = {
  getAll: (params) => api.get('/departments', { params }),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// Reports API
export const reportsAPI = {
  getFinancial: (params) => api.get('/reports/financial', { params }),
  getBudgetPerformance: (params) => api.get('/reports/budget-performance', { params }),
  getDepartmentWise: (params) => api.get('/reports/department-wise', { params }),
  getExpenseTrends: (params) => api.get('/reports/expense-trends', { params }),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications'),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getActivityLogs: (params) => api.get('/admin/activity-logs', { params }),
  getFinancialSummary: (params) => api.get('/admin/financial-summary', { params }),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
};

export default api;
