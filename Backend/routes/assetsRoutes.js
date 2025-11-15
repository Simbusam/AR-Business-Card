const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMyImages,
  getMyVideos,
  getMyAssets,
  adminGetUserAssets,
  getMyLatest,
  adminGetUserLatest,
} = require('../controllers/assetsController');

// All routes protected
router.use(protect);

// Current user's assets
router.get('/my/images', getMyImages);
router.get('/my/videos', getMyVideos);
router.get('/my', getMyAssets); // optional query: ?type=image|video&limit=&page=&projectId=
router.get('/my/latest', getMyLatest); // optional query: ?projectId=

// Admin: get assets by target Mongo user id
router.get('/user/:mongoUserId', adminGetUserAssets);
router.get('/user/:mongoUserId/latest', adminGetUserLatest);

// NOTE: Old /ar-view/:projectId endpoint removed
// Use /api/v1/ar/check/:projectId and /api/v1/ar/generate/:projectId instead

module.exports = router;
