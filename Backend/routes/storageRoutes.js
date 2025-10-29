const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadLogo: logoFilter, uploadVideoOrGLB: contentFilter } = require('../middleware/multer');
const { uploadLogo, uploadContent, listProjectMedia } = require('../controllers/storageController');

router.use(protect);

router.post('/:userId/:projectId/logo', logoFilter.single('file'), uploadLogo);
router.post('/:userId/:projectId/content', contentFilter.single('file'), uploadContent);
router.get('/:userId/:projectId', listProjectMedia);

module.exports = router;
