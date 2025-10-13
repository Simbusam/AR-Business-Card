module.exports = {
    JWT_SECRET: process.env.JWT_SECRET || 'secret-key',
    JWT_EXPIRE: '24h', // Token expiration time
    COOKIE_EXPIRE: 7, // Cookie expiration in days
  };