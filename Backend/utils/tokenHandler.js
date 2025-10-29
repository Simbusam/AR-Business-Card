const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/config');

// Generate token with user's id and role included in the payload
const generateToken = (user, expiresIn = config.JWT_EXPIRE) => {
  const id = user.id || user._id;
  const role = user.role || 'user';
  return jwt.sign(
    {
      id,
      role,
    },
    config.JWT_SECRET,
    {
      expiresIn,
    }
  );
};

// Send token response with user details (including role) returned in the JSON response
const sendTokenResponse = (user, statusCode, res, options = {}) => {
  const token = generateToken(user, options.expiresIn || config.JWT_EXPIRE );

  // Generate CSRF token for double submit cookie pattern
  const csrfToken = crypto.randomBytes(32).toString('hex');

  const cookieOptions = {
    expires: new Date(
      Date.now() +
        (options.expiresIn
          ? 30 * 24 * 60 * 60 * 1000
          : config.COOKIE_EXPIRE * 24 * 60 * 60 * 1000)
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .cookie('XSRF-TOKEN', csrfToken, { 
      ...cookieOptions, 
      httpOnly: false // Needs to be readable by client-side JS
    })
    .json({
      success: true,
      token,
      data: {
        id: user.id || user._id,
        firstName: user.firstName || user.first_name,
        lastName: user.lastName || user.last_name,
        email: user.email,
        role: user.role || 'user',
      },
    });
};
// Add token verification middleware
const verifyToken = (req, res, next) => {
  // Get token from cookie or header
  let token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Not authorized to access this route' 
    });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
};



module.exports = {
  generateToken,
  sendTokenResponse,
};
