const bcrypt = require('bcryptjs');
const { createAppUser, findAppUserByEmail, findAppUserById } = require('../db/mysql');
const ErrorResponse = require('../utils/errorResponse');
const { generateToken, sendTokenResponse } = require('../utils/tokenHandler');
const validator = require('validator');
const { randomUUID } = require('crypto');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, agreedToPrivacyPolicy } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return next(new ErrorResponse('All fields are required', 400));
    }

    if (!validator.isEmail(email)) {
      return next(new ErrorResponse('Please provide a valid email', 400));
    }

    if (password !== confirmPassword) {
      return next(new ErrorResponse('Passwords do not match', 400));
    }

    if (!agreedToPrivacyPolicy) {
      return next(new ErrorResponse('You must agree to the privacy policy', 400));
    }

    // Check if user already exists (MySQL)
    const existingUser = await findAppUserByEmail(email);
    if (existingUser) {
      return next(new ErrorResponse('Email is already registered', 400));
    }

    // Hash password and create user (MySQL)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = randomUUID();
    await createAppUser({
      id,
      firstName,
      lastName,
      email,
      role: 'user',
      passwordHash,
      agreedPrivacy: !!agreedToPrivacyPolicy,
    });

    const user = { id, firstName, lastName, email, role: 'user' };
    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password, rememberMe, role } = req.body;

    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide an email and password', 400));
    }

    if (!validator.isEmail(email)) {
      return next(new ErrorResponse('Please provide a valid email', 400));
    }

    // Check for user in MySQL
    const userRow = await findAppUserByEmail(email);

    if (!userRow) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, userRow.password_hash);

    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Set longer expiration if rememberMe is true
    const tokenOptions = {};
    if (rememberMe) {
      tokenOptions.expiresIn = '30d';
    }

    // Send token response
    const user = { id: userRow.id, firstName: userRow.first_name, lastName: userRow.last_name, email: userRow.email, role: userRow.role };
    sendTokenResponse(user, 200, res, tokenOptions);
  } catch (err) {
    next(err);
  }
};
// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const row = await findAppUserById(req.user.id);
    if (!row) {
      return next(new ErrorResponse('User not found', 404));
    }
    res.status(200).json({
      success: true,
      data: {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        role: row.role,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    });
  } catch (err) {
    next(err);
  }
};