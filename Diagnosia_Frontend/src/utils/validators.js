import { VALIDATION_RULES, ERROR_MESSAGES } from './constants';

export const validators = {
  required: (value) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return ERROR_MESSAGES.REQUIRED_FIELD;
    }
    return null;
  },

  email: (value) => {
    if (!value) return null;
    if (!VALIDATION_RULES.EMAIL.test(value)) {
      return ERROR_MESSAGES.INVALID_EMAIL;
    }
    return null;
  },

  phone: (value) => {
    if (!value) return null;
    const cleanPhone = value.replace(/\s+/g, '');
    if (!VALIDATION_RULES.PHONE.test(cleanPhone)) {
      return ERROR_MESSAGES.INVALID_PHONE;
    }
    return null;
  },

  password: (value) => {
    if (!value) return null;
    if (!VALIDATION_RULES.PASSWORD.test(value)) {
      return ERROR_MESSAGES.WEAK_PASSWORD;
    }
    return null;
  },

  confirmPassword: (password, confirmPassword) => {
    if (!confirmPassword) return null;
    if (password !== confirmPassword) {
      return ERROR_MESSAGES.PASSWORDS_DONT_MATCH;
    }
    return null;
  },

  minLength: (min) => (value) => {
    if (!value) return null;
    if (value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (max) => (value) => {
    if (!value) return null;
    if (value.length > max) {
      return `Must be no more than ${max} characters`;
    }
    return null;
  },

  age: (value) => {
    if (!value) return null;
    const age = parseInt(value);
    if (isNaN(age) || age < 0 || age > 150) {
      return 'Please enter a valid age';
    }
    return null;
  },
};

// Validate a single field
export const validateField = (value, validationRules) => {
  for (const rule of validationRules) {
    const error = rule(value);
    if (error) {
      return error;
    }
  }
  return null;
};

// Validate entire form
export const validateForm = (formData, validationSchema) => {
  const errors = {};
  let isValid = true;

  Object.keys(validationSchema).forEach(field => {
    const fieldError = validateField(formData[field], validationSchema[field]);
    if (fieldError) {
      errors[field] = fieldError;
      isValid = false;
    }
  });

  return { isValid, errors };
};

// Common validation schemas
export const validationSchemas = {
  login: {
    email: [validators.required, validators.email],
    password: [validators.required],
  },

  register: {
    firstName: [validators.required, validators.minLength(2)],
    lastName: [validators.required, validators.minLength(2)],
    email: [validators.required, validators.email],
    phone: [validators.required, validators.phone],
    password: [validators.required, validators.password],
    confirmPassword: [validators.required],
    dateOfBirth: [validators.required],
    gender: [validators.required],
  },

  booking: {
    testId: [validators.required],
    appointmentDate: [validators.required],
    timeSlot: [validators.required],
    collectionType: [validators.required],
    specialInstructions: [validators.maxLength(500)],
  },

  profile: {
    firstName: [validators.required, validators.minLength(2)],
    lastName: [validators.required, validators.minLength(2)],
    phone: [validators.required, validators.phone],
    dateOfBirth: [validators.required],
    address: [validators.required],
  },
};