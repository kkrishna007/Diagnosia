import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // If an Authorization header is already present (e.g. employee_token passed explicitly), don't overwrite it
    if (!config.headers) config.headers = {};
    if (!config.headers.Authorization) {
      // prefer the regular user token, fall back to employee token when present
      const token = localStorage.getItem('token') || localStorage.getItem('employee_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - route to employee login if the request was to an employee API
      try {
        const base = error.config?.baseURL || '';
        const url = error.config?.url || '';
        const full = `${base}${url}`.toLowerCase();
        if (full.includes('/employee/')) {
          localStorage.removeItem('employee_token');
          // if the failing request was to admin endpoints, redirect to admin login
          if (full.includes('/employee/admin/')) {
            window.location.href = '/admin/login';
          } else {
            window.location.href = '/employee/login';
          }
        } else {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      } catch (e) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    
    if (error.response?.status === 500) {
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Auth endpoints
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getCurrentUser: () => api.get('/auth/me'),
    refreshToken: () => api.post('/auth/refresh'),
  },

  // User endpoints
  users: {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
    getAppointments: () => api.get('/users/appointments'),
    getTestResults: () => api.get('/users/test-results'),
  },

  // Test endpoints
  tests: {
    getAll: (params) => api.get('/tests', { params }),
    getById: (id) => api.get(`/tests/${id}`),
    getCategories: () => api.get('/tests/categories'),
    search: (query) => api.get(`/tests/search?q=${query}`),
  },

  // Booking endpoints
  bookings: {
    create: (bookingData) => api.post('/bookings', bookingData),
    getById: (id) => api.get(`/bookings/${id}`),
    update: (id, data) => api.put(`/bookings/${id}`, data),
    cancel: (id) => api.delete(`/bookings/${id}`),
    getAvailableSlots: (date, testId) => 
      api.get(`/bookings/slots?date=${date}&testId=${testId}`),
  },

  // Notification endpoints
  notifications: {
    getAll: () => api.get('/notifications'),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    getUnreadCount: () => api.get('/notifications/unread-count'),
  },

  // Chatbot endpoints
  chatbot: {
    sendMessage: (message) => api.post('/chatbot/message', { message }),
    getFAQs: () => api.get('/chatbot/faqs'),
  },

  // Employee endpoints
  employeeAuth: {
  login: (payload) => api.post('/employee/auth/login', payload),
  loginAdmin: (payload) => api.post('/employee/auth/admin/login', payload),
  },
  employee: {
    // helper to include employee token from localStorage
    getCollectorTasks: () => {
      const token = localStorage.getItem('employee_token');
      return api.get('/employee/collector/tasks', { headers: { Authorization: token ? `Bearer ${token}` : '' } });
    },
    assignTask: (taskId) => {
      const token = localStorage.getItem('employee_token');
  return api.post(`/employee/collector/tasks/${taskId}/assign`, {}, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
    },
    collectTask: (taskId) => {
      const token = localStorage.getItem('employee_token');
  return api.post(`/employee/collector/tasks/${taskId}/collect`, {}, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
    },
    getLabWorklist: () => {
      const token = localStorage.getItem('employee_token');
      return api.get('/employee/lab/worklist', { headers: { Authorization: token ? `Bearer ${token}` : '' } });
    },
    getPanel: (testCode) => {
      const token = localStorage.getItem('employee_token');
      return api.get(`/employee/lab/panels/${encodeURIComponent(testCode)}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
    },
    saveTestResult: (payload) => {
      const token = localStorage.getItem('employee_token');
      return api.post('/employee/lab/results', payload, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
    },
    getTestResult: (appointmentTestId) => {
      const token = localStorage.getItem('employee_token');
      return api.get(`/employee/lab/results/${appointmentTestId}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
    },
    generateInterpretation: (payload) => {
      const token = localStorage.getItem('employee_token');
      return api.post(
        '/employee/lab/generate-interpretation',
        payload,
        {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
          timeout: 30000, // 30s only for this Gemini request
        }
      );
    },
    getAdminOverview: () => {
      const token = localStorage.getItem('employee_token');
      return api.get('/employee/admin/overview', { headers: { Authorization: token ? `Bearer ${token}` : '' } });
    },
    createUser: (data) => {
      const token = localStorage.getItem('employee_token');
      return api.post('/employee/admin/users', data, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
    },
    listUsers: () => {
      const token = localStorage.getItem('employee_token');
      return api.get('/employee/admin/users', { headers: { Authorization: token ? `Bearer ${token}` : '' } });
    },
    updateUser: (id, data) => {
      const token = localStorage.getItem('employee_token');
      return api.put(`/employee/admin/users/${id}`, data, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
    },
    deleteUser: (id) => {
      const token = localStorage.getItem('employee_token');
      return api.delete(`/employee/admin/users/${id}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
    },
    getUserDependents: (id) => {
      const token = localStorage.getItem('employee_token');
      return api.get(`/employee/admin/users/${id}/dependents`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
    },
    forceDeleteUser: (id) => {
      const token = localStorage.getItem('employee_token');
  return api.post(`/employee/admin/users/${id}/force-delete`, {}, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
    },
  },
};

export default api;