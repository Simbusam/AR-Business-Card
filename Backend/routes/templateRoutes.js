const express = require('express');
const router = express.Router();

const templatesHardcoded = require('../models/templatesHardcoded');

// GET /api/v1/templates
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: templatesHardcoded
  });
});

module.exports = router;
