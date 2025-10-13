const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists at Backend/uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Base storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, Date.now() + '-' + safeName);
  }
});

// Generic file filter for images and 3D models (legacy usage)
const genericFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|gltf|glb/;
  const extname = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowed.test(file.mimetype);
  if (extname && mimetype) return cb(null, true);
  return cb(new Error('Only images or 3D models are allowed'), false);
};

// Strict logo filter: only JPG/PNG
const logoFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png/;
  const extname = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowed.test(file.mimetype);
  if (extname && mimetype) return cb(null, true);
  return cb(new Error('Only JPG and PNG formats are allowed for logo'), false);
};

// Video filter: allow most common formats (mp4, webm, mov, mkv)
const videoFileFilter = (req, file, cb) => {
  const allowedExt = /mp4|webm|mov|mkv/;
  const extname = allowedExt.test(path.extname(file.originalname).toLowerCase());
  const mimetypeOk = (
    file.mimetype === 'video/mp4' ||
    file.mimetype === 'video/webm' ||
    file.mimetype === 'video/quicktime' ||
    file.mimetype === 'video/x-matroska'
  );
  if (extname && mimetypeOk) return cb(null, true);
  return cb(new Error('Only MP4, WEBM, MOV, or MKV videos are allowed'), false);
};

// Video or GLB (3D model) filter for final step
const videoOrGlbFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isGlb = ext === '.glb' || file.mimetype === 'model/gltf-binary' || file.mimetype === 'application/octet-stream';
  const isVideo = (
    file.mimetype === 'video/mp4' ||
    file.mimetype === 'video/webm' ||
    file.mimetype === 'video/quicktime' ||
    file.mimetype === 'video/x-matroska'
  );
  if (isGlb || isVideo) return cb(null, true);
  return cb(new Error('Only video (MP4/WEBM/MOV/MKV) or GLB files are allowed for final upload'), false);
};

// Factory helpers
const uploadGeneric = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 }, fileFilter: genericFileFilter });
const uploadLogo = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: logoFileFilter });
// No explicit size limit for video as per requirement (note: reverse proxy/server may still limit request size)
const uploadVideo = multer({ storage, fileFilter: videoFileFilter });
// Final step: accept either video or GLB up to 200MB
const uploadVideoOrGLB = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 }, fileFilter: videoOrGlbFilter });

module.exports = {
  uploadGeneric,
  uploadLogo,
  uploadVideo,
  uploadVideoOrGLB
};
