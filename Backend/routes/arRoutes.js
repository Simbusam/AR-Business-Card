// routes/arRoutes.js
const express = require('express');
const router = express.Router();
const apiKeyOptional = require('../middleware/apiKey');
const { listProjects, getProject, getScene, getAssets } = require('../controllers/arController');

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

module.exports = router;
