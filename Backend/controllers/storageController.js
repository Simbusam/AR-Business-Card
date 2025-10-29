const path = require('path');
const fs = require('fs').promises;
const { putObject, listObjects } = require('../services/s3');

const bucket = process.env.S3_BUCKET || '';
// Optional base prefix inside the bucket, e.g. "ar-business-card/"
const basePrefix = (() => {
  const p = process.env.S3_BASE_PREFIX || '';
  if (!p) return '';
  return p.endsWith('/') ? p : `${p}/`;
})();

const uploadLogo = async (req, res, next) => {
  try {
    const { userId, projectId } = req.params;
    if (!req.file) return res.status(400).json({ message: 'File required' });
    const filePath = req.file.path;
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(req.file.originalname).toLowerCase();
  // Always store as logo.ext (ext = .jpg/.png)
  const logoExt = path.extname(req.file.originalname).toLowerCase();
  const key = `${basePrefix}${userId}/${projectId}/assets/logo/logo${logoExt}`;
  await putObject({ Bucket: bucket, Key: key, Body: buffer, ContentType: req.file.mimetype });
  await fs.unlink(filePath).catch(() => {});
  return res.json({ key, url: `s3://${bucket}/${key}` });
  } catch (e) {
    return next(e);
  }
};

const uploadContent = async (req, res, next) => {
  try {
    const { userId, projectId } = req.params;
    if (!req.file) return res.status(400).json({ message: 'File required' });
    const filePath = req.file.path;
    const buffer = await fs.readFile(filePath);
    // Store as video.ext or model.glb based on file type
    const contentExt = path.extname(req.file.originalname).toLowerCase();
    let key;
    if (contentExt === '.glb') {
      key = `${basePrefix}${userId}/${projectId}/assets/content/model.glb`;
    } else {
      // Default to video for all other types
      key = `${basePrefix}${userId}/${projectId}/assets/content/video${contentExt}`;
    }
    await putObject({ Bucket: bucket, Key: key, Body: buffer, ContentType: req.file.mimetype });
    await fs.unlink(filePath).catch(() => {});
    return res.json({ key, url: `s3://${bucket}/${key}` });
  } catch (e) {
    return next(e);
  }
};

const listProjectMedia = async (req, res, next) => {
  try {
    const { userId, projectId } = req.params;
    const prefix = `${basePrefix}${userId}/${projectId}/assets/`;
    const out = await listObjects({ Bucket: bucket, Prefix: prefix });
    const items = (out.Contents || []).map(o => ({ key: o.Key, size: o.Size, lastModified: o.LastModified }));
    return res.json({ prefix, items });
  } catch (e) {
    return next(e);
  }
};

module.exports = { uploadLogo, uploadContent, listProjectMedia };
