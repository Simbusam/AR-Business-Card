const express = require('express');
const router = express.Router();
const {
  createProject,
  getAllProjects,
  getProject,
  updateProject,
  deleteProject,
  uploadBusinessCardLogo,
  uploadBusinessCardVideo,
  uploadBusinessCardCardImage,
  uploadBusinessCardFinal,
  uploadProjectAsset,
  getBusinessCardVideoPage
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { uploadGeneric, uploadLogo, uploadVideo, uploadVideoOrGLB } = require('../middleware/multer');

// Apply authentication middleware to all routes
router.use(protect);

// Route to create a new project from a template
router.post('/template', uploadGeneric.single('file'), createProject);

// Business Card Design flow
// Step 1: upload logo (JPG/PNG only, up to 10MB) - accept 'logo' or 'image' field
router.post('/business-card/logo', uploadLogo.fields([{ name: 'logo', maxCount: 1 }, { name: 'image', maxCount: 1 }]), uploadBusinessCardLogo);

// Step 2: upload video (MP4/WEBM/MOV, 200KB - 200MB) and finalize
router.post('/business-card/video', uploadVideo.single('video'), uploadBusinessCardVideo);
// Optional page to upload video if frontend route is unavailable
router.get('/business-card/video-page', getBusinessCardVideoPage);

// New flow continuity: after logo, upload the business card image
router.post('/business-card/card', uploadLogo.single('card'), uploadBusinessCardCardImage);
// Optional page to upload the business card image if frontend route is unavailable
router.get('/business-card/card-page', (req, res, next) => require('../controllers/projectController').getBusinessCardCardPage(req, res, next));

// Final step can accept either a video or a GLB file
router.post('/business-card/final', uploadVideoOrGLB.single('final'), uploadBusinessCardFinal);

// XR read endpoints by code
router.get('/xr/:code', (req, res, next) => require('../controllers/projectController').getXRSetByCode(req, res, next));
router.get('/xr/:code/:slot', (req, res, next) => require('../controllers/projectController').getXRSlotByCode(req, res, next));

// Editor asset upload (image/video) - accept both 'file' and 'image' field names
router.post('/:id/assets', uploadGeneric.fields([{ name: 'file', maxCount: 1 }, { name: 'image', maxCount: 1 }]), uploadProjectAsset);
// Route to get all projects
router.get('/', getAllProjects);

// Route to get a specific project by ID
router.get('/:id', getProject);

// Route to update a specific project by ID
router.put('/:id', updateProject);

// Route to delete a specific project by ID
router.delete('/:id', deleteProject);

module.exports = router;
