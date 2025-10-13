const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Safe logging
  const stack = err && err.stack ? err.stack : null;
  const msg = err && err.message ? err.message : String(err);
  if (stack) {
    console.error(stack);
  } else {
    console.error(msg);
  }

  // Remove Mongoose-specific handling; using MySQL now

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Not authorized, token failed';
    error = new ErrorResponse(message, 401);
  }

  // JWT expired
  if (err.name === 'TokenExpiredError') {
    const message = 'Token has expired';
    error = new ErrorResponse(message, 401);
  }

  // Default to 500 server error
  if (!error.statusCode) {
    error.statusCode = 500;
    error.message = 'Server Error';
  }

  // Send error response
  const payload = {
    success: false,
    error: {
      message: error.message || 'Server Error',
      statusCode: error.statusCode || 500
    }
  };
  if (process.env.NODE_ENV === 'development') {
    payload.error.stack = err && err.stack ? err.stack : undefined;
  }
  res.status(error.statusCode).json(payload);
};

module.exports = errorHandler;