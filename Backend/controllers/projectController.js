const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const QRCode = require('qrcode');
const templates = require('../models/templatesHardcoded');
const path = require('path');
const { randomUUID } = require('crypto');
const fs = require('fs').promises;
const { listObjects, getJson, putJson, deleteObject, bucket, getS3Url } = require('../services/s3');
const {
  createProject: createProjectDB,
  getProjectById,
  listProjectsByOwner,
  updateProject: updateProjectDB,
  deleteProject: deleteProjectDB,
  incrementProjectViews
} = require('../db/mysql');
const basePrefix = (process.env.S3_BASE_PREFIX ? (process.env.S3_BASE_PREFIX.endsWith('/') ? process.env.S3_BASE_PREFIX : process.env.S3_BASE_PREFIX + '/') : '');

function projectKey(ownerUserId, projectId) {
  return `${basePrefix}${ownerUserId}/project${projectId}/meta/project.json`;
}

function listOwnerPrefix(ownerUserId) {
  return `${basePrefix}${ownerUserId}/`;
}

// @desc    Create new project from template
// @route   POST /api/v1/projects/template
// @access  Private
exports.createProject = asyncHandler(async (req, res, next) => {
  console.log('createProject called with req.body:', req.body);
  console.log('req.file:', req.file);
  console.log('req.files:', req.files);
  const { templateId } = req.body;
  if (!templateId) return next(new ErrorResponse('Template ID is required', 400));

  const template = templates.find(t => t._id === templateId);
  if (!template) return next(new ErrorResponse('Template not found', 404));

  const ownerUserId = req.user.role === 'admin' && req.body.owner ? req.body.owner : req.user.id;
  const projectId = randomUUID();

  // Create project in MySQL database
  const project = await createProjectDB({
    id: projectId,
    owner_user_id: ownerUserId,
    name: template.name,
    description: template.description,
    thumbnail: template.thumbnail || null,
    scene_data: {},
    is_public: 0,
    is_archived: 0,
  });

  console.log('Project created in MySQL:', projectId);
  return res.status(201).json({ success: true, data: project });
});

// =========================
// XR read endpoints by set code
// =========================
exports.getXRSetByCode = asyncHandler(async (req, res, next) => {
  const { code } = req.params;
  const { getPool } = require('../db/mysql');
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT s.code, s.project_id,
            aL.id AS logo_id, aL.url AS logo_url,
            aC.id AS card_id, aC.url AS card_url,
            aV.id AS video_id, aV.url AS video_url
     FROM user_card_sets s
     LEFT JOIN assets aL ON aL.id = s.logo_asset_id
     LEFT JOIN assets aC ON aC.id = s.card_image_asset_id
     LEFT JOIN assets aV ON aV.id = s.video_asset_id
     WHERE s.code = ? LIMIT 1`,
    [code]
  );
  if (!rows.length) return next(new ErrorResponse('XR set not found', 404));
  const r = rows[0];
  return res.status(200).json({
    success: true,
    data: {
      code: r.code,
      projectId: r.project_id,
      logo: r.logo_id ? { assetId: r.logo_id, url: r.logo_url } : null,
      card: r.card_id ? { assetId: r.card_id, url: r.card_url } : null,
      video: r.video_id ? { assetId: r.video_id, url: r.video_url } : null
    }
  });
});

exports.getXRSlotByCode = asyncHandler(async (req, res, next) => {
  const { code, slot } = req.params;
  const slotCol = slot === 'logo' ? 'logo_asset_id'
                 : slot === 'card' ? 'card_image_asset_id'
                 : slot === 'video' ? 'video_asset_id'
                 : null;
  if (!slotCol) return next(new ErrorResponse('Invalid slot', 400));
  const { getPool } = require('../db/mysql');
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT a.id, a.url
     FROM user_card_sets s
     LEFT JOIN assets a ON a.id = s.${slotCol}
     WHERE s.code = ? LIMIT 1`,
    [code]
  );
  if (!rows.length || !rows[0].id) return next(new ErrorResponse('Asset not found for slot', 404));
  return res.status(200).json({ success: true, data: { assetId: rows[0].id, url: rows[0].url } });
});

// @desc    Simple HTML page for card image upload (fallback if frontend page is not available)
// @route   GET /api/v1/projects/business-card/card-page
// @access  Private
exports.getBusinessCardCardPage = asyncHandler(async (req, res, next) => {
  const { projectId } = req.query;
  if (!projectId) {
    return next(new ErrorResponse('Valid projectId is required in query', 400));
  }

  const html = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Upload Business Card Image</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; max-width: 720px; margin: auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; }
        .row { margin-bottom: 12px; }
        input[type=file] { display: block; }
        button { padding: 8px 16px; background: #1565c0; color: white; border: 0; border-radius: 4px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Upload Business Card Image</h2>
        <form action="/api/v1/projects/business-card/card" method="post" enctype="multipart/form-data">
          <div class="row">
            <label>Project ID</label>
            <input type="text" name="projectId" value="${projectId}" readonly />
          </div>
          <div class="row">
            <label for="card">Choose image (JPG/PNG)</label>
            <input id="card" type="file" name="card" accept="image/png,image/jpeg" required />
          </div>
          <button type="submit">Upload Card</button>
        </form>
      </div>
    </body>
  </html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
});

// @desc    Upload business card image (after logo) and attach to existing project
// @route   POST /api/v1/projects/business-card/card
// @access  Private
exports.uploadBusinessCardCardImage = asyncHandler(async (req, res, next) => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('📸 UPLOAD BUSINESS CARD IMAGE STARTED');
    console.log('='.repeat(60));

    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'NO FILE');
    console.log('User:', req.user ? { id: req.user.id, email: req.user.email } : 'NO USER');

    const { projectId } = req.body;
    console.log('Project ID from body:', projectId);

    if (!projectId) {
      console.error('❌ No projectId provided');
      return next(new ErrorResponse('projectId is required', 400));
    }

    if (!req.file) {
      console.error('❌ No file uploaded');
      return next(new ErrorResponse('Card image file is required', 400));
    }

    const owner = req.user.id;
    console.log('Owner ID:', owner);
  // Build S3 key and upload the image with proper name
  const ext = path.extname(req.file.originalname).toLowerCase();
  const filename = `Card${ext}`; // Rename to "Card.jpg" or "Card.png"
  const key = `${basePrefix}${owner}/project${projectId}/assets/images/${filename}`;
  console.log('📤 Uploading card image with name:', filename);
  console.log('   S3 Key:', key);

  const fs = require('fs').promises;
  const buffer = await fs.readFile(req.file.path);
  console.log('   Buffer size:', buffer.length, 'bytes');

  await require('../services/s3').putObject({ Bucket: bucket, Key: key, Body: buffer, ContentType: req.file.mimetype });
  console.log('✅ Card image uploaded to S3');

  await fs.unlink(req.file.path).catch(() => {});
  console.log('✅ Temporary file cleaned up');

  const fileUrl = bucket === 'local-bucket'
    ? `http://localhost:${process.env.PORT || 3005}/uploads/${key}`
    : `https://${bucket}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${key}`;
  console.log('✅ File URL:', fileUrl);

  // Save asset metadata to MySQL
  console.log('💾 Saving asset metadata to MySQL...');
  const { insertAsset, insertImageAsset } = require('../db/mysql');
  const mysqlUserId = req.user.id; // User is already authenticated, use their ID directly
  console.log('MySQL User ID:', mysqlUserId);
  const assetId = randomUUID();
  console.log('Generated Asset ID:', assetId);

  console.log('📝 Inserting asset record...');
  await insertAsset({
    id: assetId,
    user_id: mysqlUserId,
    project_id: projectId,
    type: 'image',
    mime: req.file.mimetype,
    name: `Card${ext}`, // Use renamed filename
    size: req.file.size,
    url: fileUrl,
    storage_path: path.join('uploads', key)
  });
  console.log('✅ Asset record inserted');

  const imageAssetId = randomUUID();
  console.log('Generated Image Asset ID:', imageAssetId);

  console.log('📝 Inserting image asset record...');
  await insertImageAsset({
    id: imageAssetId,
    user_id: mysqlUserId,
    project_id: projectId,
    mime: req.file.mimetype,
    name: `Card${ext}`, // Use renamed filename
    size: req.file.size,
    url: fileUrl,
    storage_path: path.join('uploads', key)
  });
  console.log('✅ Image asset record inserted');

  // Update business-card.json
  console.log('📝 Updating business-card.json...');
  const bcKey = `${basePrefix}${owner}/project${projectId}/meta/business-card.json`;
  console.log('Business card JSON key:', bcKey);

  let bc = {};
  try {
    bc = await getJson({ Bucket: bucket, Key: bcKey });
    console.log('✅ Existing business card data loaded');
  } catch (e) {
    console.log('⚠️  No existing business card data, creating new');
  }

  bc.cardImageUrl = fileUrl;
  bc.updated_at = new Date().toISOString();
  await putJson({ Bucket: bucket, Key: bcKey, json: bc });
  console.log('✅ Business card JSON updated');

  const nextStepUrl = (process.env.CLIENT_URL
    ? `${process.env.CLIENT_URL}/business-card/final?projectId=${projectId}`
    : `${req.protocol}://${req.get('host')}/api/v1/projects/business-card/video-page?projectId=${projectId}`);

  // If AJAX/fetch request, return JSON so frontend can navigate; otherwise redirect.
  const isAjax = req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest' || (req.headers.accept || '').includes('application/json');
  if (!isAjax && req.query.noRedirect !== '1') {
    return res.redirect(303, nextStepUrl);
  }

  console.log('✅ Upload successful, returning response');
  console.log('='.repeat(60) + '\n');
  return res.status(201).json({ success: true, data: { projectId, cardImageUrl: fileUrl, nextStepUrl } });

  } catch (error) {
    console.error('❌ Error in uploadBusinessCardCardImage:', error);
    throw error;
  }
});

// @desc    Final step: upload either a video or a GLB and attach to existing project
// @route   POST /api/v1/projects/business-card/final
// @access  Private
exports.uploadBusinessCardFinal = asyncHandler(async (req, res, next) => {
  const { projectId } = req.body;
  if (!projectId) return next(new ErrorResponse('projectId is required', 400));
  if (!req.file) return next(new ErrorResponse('Final file (video or GLB) is required', 400));

  const owner = req.user.id;
  const ext = path.extname(req.file.originalname).toLowerCase();

  // Determine file type and set appropriate name
  const isVideo = ['.mp4', '.webm', '.mov', '.avi'].includes(ext);
  const isModel = ext === '.glb';
  const filename = isVideo ? `Video${ext}` : isModel ? `Model${ext}` : `Content${ext}`;

  // Store inside assets/content/ folder (not outside assets)
  const key = `${basePrefix}${owner}/project${projectId}/assets/content/${filename}`;
  console.log('📤 Uploading final content with name:', filename);
  console.log('   Type:', isVideo ? 'Video' : isModel ? '3D Model' : 'Content');
  console.log('   S3 Key:', key);

  const fs = require('fs').promises;
  const buffer = await fs.readFile(req.file.path);
  await require('../services/s3').putObject({ Bucket: bucket, Key: key, Body: buffer, ContentType: req.file.mimetype });
  console.log('✅ Content uploaded to S3');

  await fs.unlink(req.file.path).catch(() => {});

  const url = bucket === 'local-bucket'
    ? `http://localhost:${process.env.PORT || 3005}/uploads/${key}`
    : `https://${bucket}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${key}`;
  console.log('✅ Content URL:', url);

  // Save asset metadata to MySQL
  const { insertAsset, insertVideoAsset, insertImageAsset } = require('../db/mysql');
  const mysqlUserId = req.user.id; // User is already authenticated
  const assetId = randomUUID();
  const type = ext === '.glb' ? '3d_model' : 'video';

  console.log('💾 Saving asset metadata to MySQL...');
  await insertAsset({
    id: assetId,
    user_id: mysqlUserId,
    project_id: projectId,
    type,
    mime: req.file.mimetype,
    name: filename, // Use renamed filename "Video.mp4" or "Model.glb"
    size: req.file.size,
    url,
    storage_path: path.join('uploads', key)
  });
  console.log('✅ Asset record inserted');

  if (type === 'video') {
    const videoAssetId = randomUUID();
    await insertVideoAsset({
      id: videoAssetId,
      user_id: mysqlUserId,
      project_id: projectId,
      mime: req.file.mimetype,
      name: filename, // Use renamed filename "Video.mp4"
      size: req.file.size,
      url,
      storage_path: path.join('uploads', key)
    });
    console.log('✅ Video asset record inserted');
  } else if (type === '3d_model') {
    const imageAssetId = randomUUID();
    await insertImageAsset({
      id: imageAssetId,
      user_id: mysqlUserId,
      project_id: projectId,
      mime: req.file.mimetype,
      name: filename, // Use renamed filename "Model.glb"
      size: req.file.size,
      url,
      storage_path: path.join('uploads', key)
    });
    console.log('✅ 3D Model asset record inserted');
  }

  const bcKey = `${basePrefix}${owner}/project${projectId}/meta/business-card.json`;
  let bc = {};
  try { bc = await getJson({ Bucket: bucket, Key: bcKey }); } catch (_) {}
  bc.finalUrl = url;
  bc.updated_at = new Date().toISOString();
  await putJson({ Bucket: bucket, Key: bcKey, json: bc });

  return res.status(201).json({ success: true, data: { projectId, finalUrl: url, type } });
});

// @desc    Upload logo for Business Card Design and create project
// @route   POST /api/v1/projects/business-card/logo
// @access  Private
exports.uploadBusinessCardLogo = asyncHandler(async (req, res, next) => {
  const uploaded = req.file || (req.files && (req.files.logo?.[0] || req.files.image?.[0]));
  if (!uploaded) return next(new ErrorResponse('Logo image is required (field name: logo or image)', 400));

  const owner = req.user.id;
  const projectId = randomUUID();

  // Create project in MySQL
  console.log('📝 Creating project in MySQL...');
  console.log('   Project ID:', projectId);
  console.log('   Owner ID:', owner);

  try {
    await createProjectDB({
      id: projectId,
      owner_user_id: owner,
      name: 'AR Business Card Design',
      description: 'Interactive AR-enabled business card experience',
      thumbnail: null,
      scene_data: {},
      is_public: 0,
      is_archived: 0,
    });
    console.log('✅ Project created in MySQL');
  } catch (error) {
    console.error('❌ Error creating project in MySQL:', error);
    throw error;
  }

  // Upload logo to S3 with proper name
  const ext = path.extname(uploaded.originalname).toLowerCase();
  const filename = `Logo${ext}`; // Rename to "Logo.jpg" or "Logo.png"
  const key = `${basePrefix}${owner}/project${projectId}/assets/images/${filename}`;
  console.log('📤 Uploading logo with name:', filename);

  const fs = require('fs').promises;
  const buffer = await fs.readFile(uploaded.path);
  await require('../services/s3').putObject({ Bucket: bucket, Key: key, Body: buffer, ContentType: uploaded.mimetype });
  await fs.unlink(uploaded.path).catch(() => {});

  const fileUrl = bucket === 'local-bucket'
    ? `http://localhost:${process.env.PORT || 3005}/uploads/${key}`
    : `https://${bucket}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${key}`;

  console.log('✅ Logo uploaded:', fileUrl);

  // Update project thumbnail in MySQL
  await updateProjectDB(projectId, { thumbnail: fileUrl });

  const bcKey = `${basePrefix}${owner}/project${projectId}/meta/business-card.json`;
  let bc = {};
  try { bc = await getJson({ Bucket: bucket, Key: bcKey }); } catch (_) {}
  bc.logoUrl = fileUrl;
  bc.updated_at = new Date().toISOString();
  await putJson({ Bucket: bucket, Key: bcKey, json: bc });

  // Save asset metadata to MySQL
  const { insertAsset, insertImageAsset } = require('../db/mysql');
  const mysqlUserId = req.user.id; // User is already authenticated
  const assetId = randomUUID();
  await insertAsset({
    id: assetId,
    user_id: mysqlUserId,
    project_id: projectId,
    type: 'image',
    mime: uploaded.mimetype,
    name: filename, // Use renamed filename "Logo.jpg"
    size: uploaded.size,
    url: fileUrl,
    storage_path: path.join('uploads', key)
  });
  const imageAssetId = randomUUID();
  await insertImageAsset({
    id: imageAssetId,
    user_id: mysqlUserId,
    project_id: projectId,
    mime: uploaded.mimetype,
    name: filename, // Use renamed filename "Logo.jpg"
    size: uploaded.size,
    url: fileUrl,
    storage_path: path.join('uploads', key)
  });

  const nextStepUrl = (process.env.CLIENT_URL
    ? `${process.env.CLIENT_URL}/business-card/card?projectId=${projectId}`
    : `${req.protocol}://${req.get('host')}/api/v1/projects/business-card/card-page?projectId=${projectId}`);

  const isAjax = req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest' || (req.headers.accept || '').includes('application/json');
  if (!isAjax && req.query.noRedirect !== '1') {
    return res.redirect(303, nextStepUrl);
  }

  return res.status(201).json({ success: true, data: { projectId, logoUrl: fileUrl, nextStepUrl } });
});

// @desc    Upload video for Business Card Design and finalize project
// @route   POST /api/v1/projects/business-card/video
// @access  Private
exports.uploadBusinessCardVideo = asyncHandler(async (req, res, next) => {
  const { projectId } = req.body;
  if (!projectId) {
    return next(new ErrorResponse('projectId is required', 400));
  }
  if (!req.file) {
    return next(new ErrorResponse('Video file is required', 400));
  }

  const project = await getProjectById(projectId, req.user.id);
  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }
  if (project.owner_user_id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this project', 401));
  }

  const key = `${basePrefix}${req.user.id}/project${project.id}/content/${req.file.filename}`;
  const fs = require('fs').promises;
  const buffer = await fs.readFile(req.file.path);
  await require('../services/s3').putObject({ Bucket: bucket, Key: key, Body: buffer, ContentType: req.file.mimetype });
  await fs.unlink(req.file.path).catch(() => {});
  const videoUrl = bucket === 'local-bucket' ? `http://localhost:3005/uploads/${key}` : `https://${bucket}.s3.eu-north-1.amazonaws.com/${key}`;
  // Save asset metadata to MySQL
  const { insertAsset, insertVideoAsset, getOrCreateUser } = require('../db/mysql');
  const mysqlUserId = await getOrCreateUser({
    mongoUserId: req.user.id,
    email: req.user.email,
    name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
  });
  const assetId = randomUUID();
  await insertAsset({
    id: assetId,
    user_id: mysqlUserId,
    project_id: project.id,
    type: 'video',
    mime: req.file.mimetype,
    name: req.file.originalname,
    size: req.file.size,
    url: videoUrl,
    storage_path: path.join('uploads', key)
  });
  // Also write a record into video_assets with its own unique id
  const videoAssetId = randomUUID();
  await insertVideoAsset({
    id: videoAssetId,
    user_id: mysqlUserId,
    project_id: project.id,
    mime: req.file.mimetype,
    name: req.file.originalname,
    size: req.file.size,
    url: videoUrl,
    storage_path: path.join('uploads', key)
  });

  return res.status(200).json({
    success: true,
    data: {
      projectId: project.id,
      videoUrl,
      assetId,
      videoAssetId
    }
  });
});

// @desc    Simple HTML page for video upload (fallback if frontend page is not available)
// @route   GET /api/v1/projects/business-card/video-page
// @access  Private
exports.getBusinessCardVideoPage = asyncHandler(async (req, res, next) => {
  const { projectId } = req.query;
  if (!projectId) {
    return next(new ErrorResponse('Valid projectId is required in query', 400));
  }

  // Basic HTML form that posts to the existing API endpoint
  const html = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Upload Business Card Video</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; max-width: 720px; margin: auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; }
        .row { margin-bottom: 12px; }
        input[type=file] { display: block; }
        button { padding: 8px 16px; background: #2e7d32; color: white; border: 0; border-radius: 4px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Upload Business Card Video</h2>
        <form action="/api/v1/projects/business-card/video" method="post" enctype="multipart/form-data">
          <div class="row">
            <label>Project ID</label>
            <input type="text" name="projectId" value="${projectId}" readonly />
          </div>
          <div class="row">
            <label for="video">Choose video (MP4/WEBM/MOV/MKV)</label>
            <input id="video" type="file" name="video" accept="video/mp4,video/webm,video/quicktime,video/x-matroska" required />
          </div>
          <button type="submit">Upload Video</button>
        </form>
      </div>
    </body>
  </html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
});

// @desc    Upload a single asset to a project (editor upload) and store metadata in MySQL
// @route   POST /api/v1/projects/:id/assets
// @access  Private
exports.uploadProjectAsset = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  // Support both single('file') and fields([{name:'file'},{name:'image'}])
  const uploaded = req.file || (req.files && (req.files.file?.[0] || req.files.image?.[0]));
  if (!uploaded) {
    return next(new ErrorResponse('File is required', 400));
  }

  const project = await getProjectById(id, req.user.id);
  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }
  if (project.owner_user_id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this project', 401));
  }

  const type = uploaded.mimetype.startsWith('image') ? 'image'
               : uploaded.mimetype.startsWith('video') ? 'video'
               : 'document';

  // Use common names: logo for images, video for videos
  const ext = path.extname(uploaded.originalname).toLowerCase();
  const commonName = type === 'image' ? 'logo' : type === 'video' ? 'video' : uploaded.filename;
  const filename = `${commonName}${ext}`;

  const key = `${basePrefix}${req.user.id}/project${project.id}/assets/${filename}`;
  const fs = require('fs').promises;
  const buffer = await fs.readFile(uploaded.path);
  await require('../services/s3').putObject({ Bucket: bucket, Key: key, Body: buffer, ContentType: uploaded.mimetype });
  await fs.unlink(uploaded.path).catch(() => {});
  const url = bucket === 'local-bucket' ? `http://localhost:3005/uploads/${key}` : `https://${bucket}.s3.eu-north-1.amazonaws.com/${key}`;
  const assetId = randomUUID();

  try {
    const { insertAsset, insertImageAsset, insertVideoAsset, getOrCreateUser } = require('../db/mysql');
    const mysqlUserId = await getOrCreateUser({
      mongoUserId: req.user.id,
      email: req.user.email,
      name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
    });
    await insertAsset({
      id: assetId,
      user_id: mysqlUserId,
      project_id: project.id,
      type,
      mime: uploaded.mimetype,
      name: uploaded.originalname,
      size: uploaded.size,
      url,
      storage_path: path.join('uploads', key)
    });

    // Also mirror into image_assets or video_assets
    let typedAssetId = null;
    if (type === 'image') {
      typedAssetId = randomUUID();
      await insertImageAsset({
        id: typedAssetId,
        user_id: mysqlUserId,
        project_id: project.id,
        mime: uploaded.mimetype,
        name: uploaded.originalname,
        size: uploaded.size,
        url,
        storage_path: path.join('uploads', key)
      });

      // Set as cover image in project JSON
      const projKey = projectKey(req.user.id, project.id);
      const proj = await getJson({ Bucket: bucket, Key: projKey });
      proj.cover_image_url = url;
      proj.updated_at = new Date().toISOString();
      await putJson({ Bucket: bucket, Key: projKey, json: proj });
    } else if (type === 'video') {
      typedAssetId = randomUUID();
      await insertVideoAsset({
        id: typedAssetId,
        user_id: mysqlUserId,
        project_id: project.id,
        mime: uploaded.mimetype,
        name: uploaded.originalname,
        size: uploaded.size,
        url,
        storage_path: path.join('uploads', key)
      });
    }

    // If an image was uploaded via non-AJAX form, optionally redirect to video step
    const nextStepUrl = (type === 'image')
      ? (process.env.CLIENT_URL
          ? `${process.env.CLIENT_URL}/business-card/video?projectId=${project.id}`
          : `${req.protocol}://${req.get('host')}/api/v1/projects/business-card/video-page?projectId=${project.id}`)
      : null;

    if (nextStepUrl && req.query.redirect === '1') {
      return res.redirect(303, nextStepUrl);
    }

    return res.status(201).json({
      success: true,
      data: { assetId, typedAssetId, url, projectId: project.id, type, nextStepUrl }
    });
  } catch (dbErr) {
    console.error('Asset upload DB/save error:', dbErr);
    return next(new ErrorResponse(`Asset persistence failed: ${dbErr.message}`, 500));
  }
});

// @desc    Get all projects
// @route   GET /api/v1/projects
// @access  Private
exports.getAllProjects = asyncHandler(async (req, res, next) => {
  console.log('\n📂 GET ALL PROJECTS REQUEST');
  console.log('User ID:', req.user.id);

  const owner = req.query.owner || req.user.id;
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const includeArchived = req.query.includeArchived === 'true';

  console.log('Query params:', { owner, limit, offset, includeArchived });

  // Get projects from MySQL
  const projects = await listProjectsByOwner(owner, { limit, offset, includeArchived });

  console.log('✅ Found', projects.length, 'projects');
  if (projects.length > 0) {
    console.log('Sample project:', {
      id: projects[0].id,
      name: projects[0].name,
      thumbnail: projects[0].thumbnail,
      views: projects[0].views
    });
  }

  return res.status(200).json({ success: true, data: projects });
});

// @desc    Get a project by ID
// @route   GET /api/v1/projects/:id
// @access  Private
exports.getProject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const project = await getProjectById(id);
  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  // Increment view count
  await incrementProjectViews(id);

  return res.status(200).json({ success: true, data: project });
});

// @desc    Update a project
// @route   PUT /api/v1/projects/:id
// @access  Private
exports.updateProject = asyncHandler(async (req, res, next) => {
  console.log('\n' + '='.repeat(60));
  console.log('📝 UPDATE PROJECT REQUEST');
  console.log('='.repeat(60));
  console.log('Project ID:', req.params.id);
  console.log('User ID:', req.user.id);
  console.log('Update Data:', req.body);

  const { id } = req.params;

  console.log('🔍 Checking if project exists...');
  const existing = await getProjectById(id);

  if (!existing) {
    console.error('❌ Project not found in database');
    console.error('   Searched for ID:', id);
    return next(new ErrorResponse('Project not found', 404));
  }

  console.log('✅ Project found:', existing.name);
  console.log('   Owner:', existing.owner_user_id);

  // Check authorization
  if (existing.owner_user_id !== req.user.id && req.user.role !== 'admin') {
    console.error('❌ User not authorized to update this project');
    return next(new ErrorResponse('Not authorized to update this project', 401));
  }

  console.log('✅ User authorized');
  console.log('📝 Updating project...');

  // Update project in MySQL
  const updated = await updateProjectDB(id, req.body);

  console.log('✅ Project updated successfully');
  console.log('='.repeat(60) + '\n');

  return res.status(200).json({ success: true, data: updated });
});

// @desc    Delete a project
// @route   DELETE /api/v1/projects/:id
// @access  Private
exports.deleteProject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const existing = await getProjectById(id);
  if (!existing) {
    return next(new ErrorResponse('Project not found', 404));
  }

  // Check authorization
  if (existing.owner_user_id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this project', 401));
  }

  // Delete from MySQL
  await deleteProjectDB(id);

  // Also delete S3 files if they exist
  const prefix = `${basePrefix}${existing.owner_user_id}/project${id}/`;
  try {
    const objects = await listObjects({ Bucket: bucket, Prefix: prefix });
    if (objects.Contents) {
      for (const obj of objects.Contents) {
        await deleteObject({ Bucket: bucket, Key: obj.Key });
      }
    }
  } catch (e) {
    console.error('Error deleting S3 files:', e);
  }

  return res.status(200).json({ success: true, data: {} });
});


