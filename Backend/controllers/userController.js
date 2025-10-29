const bcrypt = require('bcryptjs');
const { getPool } = require('../db/mysql');
const ErrorResponse = require('../utils/errorResponse');
const { randomUUID } = require('crypto');

// @desc    Create user (Admin only)
// @route   POST /api/v1/users
// @access  Private/Admin
exports.createUser = async (req, res, next) => {
  try {
    // Verify requesting user is admin
    if (req.user.role !== 'admin') {
      return next(
        new ErrorResponse(`User ${req.user.id} is not authorized to create users`, 403)
      );
    }

    const { firstName, lastName, email, password, role } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return next(
        new ErrorResponse('Please provide firstName, lastName, email and password', 400)
      );
    }

    // Check if user already exists
    const pool = await getPool();
    const [existingRows] = await pool.execute('SELECT id FROM app_users WHERE email = ? LIMIT 1', [email]);
    const existingUser = existingRows.length ? existingRows[0] : null;
    if (existingUser) {
      return next(
        new ErrorResponse('Email is already registered', 400)
      );
    }

    // Create user
    const id = randomUUID();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    await pool.execute(
      'INSERT INTO app_users (id, first_name, last_name, email, role, password_hash, agreed_privacy) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [id, firstName, lastName, email, role || 'user', passwordHash]
    );
    const user = { id, firstName, lastName, email, role: role || 'user' };

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return next(
        new ErrorResponse(`User ${req.user.id} is not authorized to access all users`, 403)
      );
    }

    const pool = await getPool();
    const [users] = await pool.query('SELECT id, first_name AS firstName, last_name AS lastName, email, role, created_at AS createdAt, updated_at AS updatedAt FROM app_users ORDER BY created_at DESC');
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private
exports.getUser = async (req, res, next) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.execute('SELECT id, first_name AS firstName, last_name AS lastName, email, role, created_at AS createdAt, updated_at AS updatedAt FROM app_users WHERE id = ? LIMIT 1', [req.params.id]);
    const user = rows.length ? rows[0] : null;

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is the owner or admin
    if (user.id !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(`User ${req.user.id} is not authorized to access this user`, 401)
      );
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private
exports.updateUser = async (req, res, next) => {
  try {
    const pool = await getPool();
    const [existingRows] = await pool.execute('SELECT id, first_name, last_name, email, role FROM app_users WHERE id = ? LIMIT 1', [req.params.id]);
    let user = existingRows.length ? existingRows[0] : null;

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is the owner or admin
    if (user.id !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(`User ${req.user.id} is not authorized to update this user`, 401)
      );
    }

    // Update fields
    const updates = [];
    const params = [];
    if (req.body.firstName !== undefined) { updates.push('first_name = ?'); params.push(req.body.firstName); }
    if (req.body.lastName !== undefined) { updates.push('last_name = ?'); params.push(req.body.lastName); }
    if (req.body.email !== undefined) { updates.push('email = ?'); params.push(req.body.email); }
    if (req.body.role !== undefined) { updates.push('role = ?'); params.push(req.body.role); }
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(req.body.password, salt);
      updates.push('password_hash = ?');
      params.push(passwordHash);
    }
    if (updates.length) {
      params.push(req.params.id);
      await pool.execute(`UPDATE app_users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, params);
    }
    const [rows] = await pool.execute('SELECT id, first_name AS firstName, last_name AS lastName, email, role, created_at AS createdAt, updated_at AS updatedAt FROM app_users WHERE id = ? LIMIT 1', [req.params.id]);
    user = rows.length ? rows[0] : null;

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private
exports.deleteUser = async (req, res, next) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.execute('SELECT id, first_name, last_name FROM app_users WHERE id = ? LIMIT 1', [req.params.id]);
    const user = rows.length ? rows[0] : null;

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is the owner or admin
    if (user.id !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(`User ${req.user.id} is not authorized to delete this user`, 401)
      );
    }

    await pool.execute('DELETE FROM app_users WHERE id = ?', [req.params.id]);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
