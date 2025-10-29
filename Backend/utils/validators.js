const validator = require('validator');
const ErrorResponse = require('./errorResponse');

// Validate register input
exports.validateRegisterInput = (data) => {
  const errors = {};

  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.firstName = 'First name is required';
  }

  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.lastName = 'Last name is required';
  }

  if (!data.email || !validator.isEmail(data.email)) {
    errors.email = 'Valid email is required';
  }

  if (!data.password || data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords must match';
  }

  if (!data.agreedToPrivacyPolicy) {
    errors.agreedToPrivacyPolicy = 'You must agree to the privacy policy';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

// Validate login input
exports.validateLoginInput = (data) => {
  const errors = {};

  if (!data.email || !validator.isEmail(data.email)) {
    errors.email = 'Valid email is required';
  }

  if (!data.password || data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};