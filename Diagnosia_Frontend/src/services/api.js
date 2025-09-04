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
    const token = localStorage.getItem('token');
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
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
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
};

export default api;