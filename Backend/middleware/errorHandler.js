const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Enhanced logging for debugging
  console.error('='.repeat(60));
  console.error('❌ ERROR OCCURRED:');
  console.error('='.repeat(60));
  console.error('Message:', err.message || 'Unknown error');
  console.error('Name:', err.name || 'Error');
  console.error('Status Code:', err.statusCode || 500);
  if (err.stack) {
    console.error('Stack Trace:');
    console.error(err.stack);
  }
  console.error('='.repeat(60));

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