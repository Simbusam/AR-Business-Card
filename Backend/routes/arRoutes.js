// routes/arRoutes.js
const express = require('express');
const router = express.Router();
const apiKeyOptional = require('../middleware/apiKey');
const { protect } = require('../middleware/auth');
const {
  listProjects,
  getProject,
  getScene,
  getAssets,
  generateARExperience,
  checkARExperience
} = require('../controllers/arController');

// Public, read-only AR data API
router.use(apiKeyOptional);

// List projects (public only unless X-API-Key is valid). Query: tag, owner, limit, skip, all=1
router.get('/projects', listProjects);

// Get full project (sceneData, assets, etc) if public or key supplied
router.get('/projects/:id', getProject);

// Get just scene data
router.get('/projects/:id/scene', getScene);

// Get assets metadata
router.get('/projects/:id/assets', getAssets);

// AR Experience Generation (Protected - requires authentication)
router.post('/generate/:projectId', protect, generateARExperience);

// Check if AR experience exists
router.get('/check/:projectId', checkARExperience);

module.exports = router;
