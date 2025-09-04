// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/me',
  },
  TESTS: {
    LIST: '/tests',
    DETAIL: '/tests',
    CATEGORIES: '/tests/categories',
    SEARCH: '/tests/search',
  },
  BOOKINGS: {
    CREATE: '/bookings',
    LIST: '/bookings',
    DETAIL: '/bookings',
    CANCEL: '/bookings',
    SLOTS: '/bookings/slots',
  },
};

// Test Categories
export const TEST_CATEGORIES = [
  { value: 'all', label: 'All Tests' },
  { value: 'blood', label: 'Blood Tests' },
  { value: 'urine', label: 'Urine Tests' },
  { value: 'imaging', label: 'Imaging' },
  { value: 'package', label: 'Health Packages' },
];

// Price Ranges
export const PRICE_RANGES = [
  { value: 'all', label: 'All Prices' },
  { value: '0-500', label: 'Under ₹500' },
  { value: '500-1000', label: '₹500 - ₹1000' },
  { value: '1000-2000', label: '₹1000 - ₹2000' },
  { value: '2000+', label: 'Above ₹2000' },
];

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  SAMPLE_COLLECTED: 'sample_collected',
  REPORT_READY: 'report_ready',
};

// Time Slots
export const TIME_SLOTS = [
  { id: '6-8', label: '6:00 AM - 8:00 AM', available: true },
  { id: '8-10', label: '8:00 AM - 10:00 AM', available: true },
  { id: '10-12', label: '10:00 AM - 12:00 PM', available: true },
  { id: '12-14', label: '12:00 PM - 2:00 PM', available: true },
  { id: '14-16', label: '2:00 PM - 4:00 PM', available: true },
  { id: '16-18', label: '4:00 PM - 6:00 PM', available: true },
  { id: '18-20', label: '6:00 PM - 8:00 PM', available: false },
];

// Sample Collection Types
export const COLLECTION_TYPES = {
  HOME: 'home_collection',
  LAB: 'lab_visit',
};

// Form Validation Rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\+]?[0-9]{10,15}$/,
  PASSWORD: /^.{6,}$/,
  NAME: /^[a-zA-Z\s]{2,50}$/,
};

// Error Messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  WEAK_PASSWORD: 'Password must be at least 6 characters long',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  INVALID_NAME: 'Name must contain only letters and be 2-50 characters long',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Logged in successfully',
  REGISTRATION_SUCCESS: 'Account created successfully',
  BOOKING_SUCCESS: 'Appointment booked successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  BOOKING_CANCELLED: 'Appointment cancelled successfully',
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'Diagnosia',
  COMPANY_NAME: 'Diagnosia Labs',
  SUPPORT_EMAIL: 'support@diagnosia.com',
  SUPPORT_PHONE: '+91 98765 43210',
  VERSION: '1.0.0',
  ADDRESS: '123 Medical Plaza, Health District, New Delhi, India - 110001',
};

// Popular Tests
export const POPULAR_TESTS = [
  'Complete Blood Count (CBC)',
  'Lipid Profile',
  'Thyroid Profile',
  'Diabetes Package',
  'Liver Function Test',
  'Kidney Function Test'
];

// Health Tips
export const HEALTH_TIPS = [
  'Stay hydrated - drink at least 8 glasses of water daily',
  'Eat a balanced diet rich in fruits and vegetables',
  'Exercise regularly - at least 30 minutes daily',
  'Get 7-8 hours of quality sleep',
  'Avoid smoking and limit alcohol consumption',
  'Regular health checkups can help detect issues early',
  'Manage stress through meditation or yoga',
  'Maintain good hygiene practices'
];