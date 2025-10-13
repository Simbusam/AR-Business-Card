const express = require('express');
const router = express.Router();
const { dbHealth } = require('../controllers/healthController');
const { protect } = require('../middleware/auth');

// Optional: protect the health route if you want
router.get('/db', dbHealth);

module.exports = router;
