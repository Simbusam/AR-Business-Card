// controllers/templateController.js

const templatesHardcoded = require('../models/templatesHardcoded');

const getAllTemplates = (req, res) => {
  try {
    res.status(200).json({ data: templatesHardcoded });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch templates' });
  }
};

module.exports = {
  getAllTemplates,
};
