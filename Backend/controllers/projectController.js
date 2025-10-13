const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const QRCode = require('qrcode');
const templates = require('../models/templatesHardcoded');
const path = require('path');
const { insertAsset, insertImageAsset, insertVideoAsset, createProjectRow, getProjectById, listProjectsByOwner, updateProjectRow, deleteProjectRow, insertBusinessCardLogo, insertBusinessCardImage, getOrCreateUserCardSet, setUserCardSetSlots } = require('../db/mysql');
const { randomUUID } = require('crypto');

// @desc    Create new project from template
// @route   POST /api/v1/projects/template
// @access  Private
exports.createProject = asyncHandler(async (req, res, next) => {
  const { templateId } = req.body;

  if (!templateId) {
    return next(new ErrorResponse('Template ID is required', 400));
  }

  const template = templates.find(t => t._id === templateId);
  if (!template) {
    return next(new ErrorResponse('Template not found', 404));
  }

  let filePath = '';
  let qrCode = '';

  if (req.file) {
    filePath = `/uploads/${req.file.filename}`;
    const arViewUrl = `${process.env.FRONTEND_URL}/ar-view/${req.file.filename}`;
    qrCode = await QRCode.toDataURL(arViewUrl);
  }

  const ownerUserId = req.user.role === 'admin' && req.body.owner ? req.body.owner : req.user.id;
  const projectId = randomUUID();
  await createProjectRow({
    id: projectId,
    ownerUserId,
    name: template.name,
    description: template.description,
    thumbnail: template.thumbnail || filePath || null,
    sceneData: {},
    isPublic: 0,
    isArchived: 0,
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
  const created = await getProjectById(projectId);
  return res.status(201).json({ success: true, data: created });
});

// @desc    Upload business card image (after logo) and attach to existing project
// @route   POST /api/v1/projects/business-card/card
// @access  Private
exports.uploadBusinessCardCardImage = asyncHandler(async (req, res, next) => {
  const { projectId } = req.body;
  if (!projectId) {
    return next(new ErrorResponse('projectId is required', 400));
  }
  if (!req.file) {
    return next(new ErrorResponse('Card image file is required', 400));
  }

  const project = await getProjectById(projectId);
  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }
  if (project.owner_user_id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this project', 401));
  }

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  const assetId = randomUUID();
  await insertAsset({
    id: assetId,
    user_id: req.user.id,
    project_id: project.id,
    type: 'image',
    mime: req.file.mimetype,
    name: 'Business Card',
    size: req.file.size,
    url: fileUrl,
    storage_path: path.join('uploads', req.file.filename)
  });
  const imageAssetId = randomUUID();
  await insertImageAsset({
    id: imageAssetId,
    user_id: req.user.id,
    project_id: project.id,
    mime: req.file.mimetype,
    name: req.file.originalname,
    size: req.file.size,
    url: fileUrl,
    storage_path: path.join('uploads', req.file.filename)
  });

  // Also persist into dedicated business card image table
  try {
    const rowId = randomUUID();
    await insertBusinessCardImage({
      id: rowId,
      project_id: project.id,
      owner_user_id: req.user.id,
      asset_id: assetId,
      mime: req.file.mimetype,
      name: 'Business Card',
      size: req.file.size,
      url: fileUrl,
      storage_path: path.join('uploads', req.file.filename)
    });
  } catch (e) {
    console.warn('business_card_images insert failed:', e.message);
  }

  // Ensure XR set exists and update slot mapping
  try {
    await getOrCreateUserCardSet({ userId: req.user.id, projectId: project.id });
    await setUserCardSetSlots({ userId: req.user.id, projectId: project.id, cardAssetId: assetId });
  } catch (e) {
    console.warn('user_card_sets update (card) failed:', e.message);
  }

  // Progress tracking in aggregate table removed per request

  const nextStepUrl = (process.env.CLIENT_URL
    ? `${process.env.CLIENT_URL}/business-card/final?projectId=${project.id}`
    : `${req.protocol}://${req.get('host')}/api/v1/projects/business-card/video-page?projectId=${project.id}`);

  // If AJAX/fetch request, return JSON so frontend can navigate; otherwise redirect.
  const isAjax = req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest' || (req.headers.accept || '').includes('application/json');
  if (!isAjax && req.query.noRedirect !== '1') {
    return res.redirect(303, nextStepUrl);
  }

  return res.status(201).json({
    success: true,
    data: {
      projectId: project.id,
      cardImageUrl: fileUrl,
      assetId,
      imageAssetId,
      nextStepUrl
    }
  });
});

// @desc    Final step: upload either a video or a GLB and attach to existing project
// @route   POST /api/v1/projects/business-card/final
// @access  Private
exports.uploadBusinessCardFinal = asyncHandler(async (req, res, next) => {
  const { projectId } = req.body;
  if (!projectId) {
    return next(new ErrorResponse('projectId is required', 400));
  }
  if (!req.file) {
    return next(new ErrorResponse('Final file (video or GLB) is required', 400));
  }

  const project = await getProjectById(projectId);
  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }
  if (project.owner_user_id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this project', 401));
  }

  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  const isVideo = req.file.mimetype.startsWith('video/');
  const isGlb = req.file.originalname.toLowerCase().endsWith('.glb') || req.file.mimetype === 'model/gltf-binary';
  let type = 'document';
  if (isVideo) type = 'video';
  else if (isGlb) type = '3d_model';

  const assetId = randomUUID();
  await insertAsset({
    id: assetId,
    user_id: req.user.id,
    project_id: project.id,
    type,
    mime: req.file.mimetype,
    name: 'Video',
    size: req.file.size,
    url,
    storage_path: path.join('uploads', req.file.filename)
  });

  let typedAssetId = null;
  if (type === 'video') {
    typedAssetId = randomUUID();
    await insertVideoAsset({
      id: typedAssetId,
      user_id: req.user.id,
      project_id: project.id,
      mime: req.file.mimetype,
      name: 'Video',
      size: req.file.size,
      url,
      storage_path: path.join('uploads', req.file.filename)
    });
  }

  // Ensure XR set exists and update slot mapping (store as Video slot)
  try {
    await getOrCreateUserCardSet({ userId: req.user.id, projectId: project.id });
    const videoAssetId = assetId; // using main assets.id
    await setUserCardSetSlots({ userId: req.user.id, projectId: project.id, videoAssetId });
  } catch (e) {
    console.warn('user_card_sets update (final) failed:', e.message);
  }

  return res.status(201).json({
    success: true,
    data: {
      projectId: project.id,
      finalUrl: url,
      type,
      assetId,
      typedAssetId
    }
  });
});

// @desc    Upload logo for Business Card Design and create project
// @route   POST /api/v1/projects/business-card/logo
// @access  Private
exports.uploadBusinessCardLogo = asyncHandler(async (req, res, next) => {
  // Support both single('logo') and fields([{ name:'logo'},{ name:'image'}])
  const uploaded = req.file || (req.files && (req.files.logo?.[0] || req.files.image?.[0]));
  if (!uploaded) {
    return next(new ErrorResponse('Logo image is required (field name: logo or image)', 400));
  }

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${uploaded.filename}`;

  const projectId = randomUUID();
  await createProjectRow({
    id: projectId,
    ownerUserId: req.user.id,
    name: 'AR Business Card Design',
    description: 'Interactive AR-enabled business card experience',
    thumbnail: fileUrl,
    sceneData: {},
    isPublic: 0,
    isArchived: 0,
  });

  // Save asset metadata to MySQL with project_id now that project exists
  const assetId = randomUUID();
  await insertAsset({
    id: assetId,
    user_id: req.user.id,
    project_id: projectId,
    type: 'image',
    mime: uploaded.mimetype,
    name: 'Logo',
    size: uploaded.size,
    url: fileUrl,
    storage_path: path.join('uploads', uploaded.filename)
  });
  // Also write a record into image_assets with its own unique id
  const imageAssetId = randomUUID();
  await insertImageAsset({
    id: imageAssetId,
    user_id: req.user.id,
    project_id: projectId,
    mime: uploaded.mimetype,
    name: uploaded.originalname,
    size: uploaded.size,
    url: fileUrl,
    storage_path: path.join('uploads', uploaded.filename)
  });

  // Also persist into dedicated logo table
  try {
    const rowId = randomUUID();
    await insertBusinessCardLogo({
      id: rowId,
      project_id: projectId,
      owner_user_id: req.user.id,
      asset_id: assetId,
      mime: uploaded.mimetype,
      name: 'Logo',
      size: uploaded.size,
      url: fileUrl,
      storage_path: path.join('uploads', uploaded.filename)
    });
  } catch (e) {
    console.warn('business_card_logos insert failed:', e.message);
  }

  // Ensure XR set exists and update slot mapping
  try {
    await getOrCreateUserCardSet({ userId: req.user.id, projectId });
    await setUserCardSetSlots({ userId: req.user.id, projectId, logoAssetId: assetId });
  } catch (e) {
    console.warn('user_card_sets update (logo) failed:', e.message);
  }

  const nextStepUrl = (process.env.CLIENT_URL
    ? `${process.env.CLIENT_URL}/business-card/card?projectId=${projectId}`
    : `${req.protocol}://${req.get('host')}/api/v1/projects/business-card/card-page?projectId=${projectId}`);

  // If AJAX/fetch request, return JSON so frontend can navigate; otherwise redirect.
  const isAjax = req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest' || (req.headers.accept || '').includes('application/json');
  if (!isAjax && req.query.noRedirect !== '1') {
    return res.redirect(303, nextStepUrl);
  }

  return res.status(201).json({
    success: true,
    data: {
      projectId: projectId,
      logoUrl: fileUrl,
      assetId,
      imageAssetId,
      nextStepUrl
    }
  });
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

  const project = await getProjectById(projectId);
  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }
  if (project.owner_user_id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this project', 401));
  }

  const videoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  // Save asset metadata to MySQL
  const assetId = randomUUID();
  await insertAsset({
    id: assetId,
    user_id: req.user.id,
    project_id: project.id,
    type: 'video',
    mime: req.file.mimetype,
    name: req.file.originalname,
    size: req.file.size,
    url: videoUrl,
    storage_path: path.join('uploads', req.file.filename)
  });
  // Also write a record into video_assets with its own unique id
  const videoAssetId = randomUUID();
  await insertVideoAsset({
    id: videoAssetId,
    user_id: req.user.id,
    project_id: project.id,
    mime: req.file.mimetype,
    name: req.file.originalname,
    size: req.file.size,
    url: videoUrl,
    storage_path: path.join('uploads', req.file.filename)
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

  const project = await getProjectById(id);
  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }
  if (project.owner_user_id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this project', 401));
  }

  const url = `${req.protocol}://${req.get('host')}/uploads/${uploaded.filename}`;
  const assetId = randomUUID();
  const type = uploaded.mimetype.startsWith('image') ? 'image'
               : uploaded.mimetype.startsWith('video') ? 'video'
               : 'document';

  try {
    await insertAsset({
      id: assetId,
      user_id: req.user.id,
      project_id: project.id,
      type,
      mime: uploaded.mimetype,
      name: uploaded.originalname,
      size: uploaded.size,
      url,
      storage_path: path.join('uploads', uploaded.filename)
    });

    // Also mirror into image_assets or video_assets
    let typedAssetId = null;
    if (type === 'image') {
      typedAssetId = randomUUID();
      await insertImageAsset({
        id: typedAssetId,
        user_id: req.user.id,
        project_id: project.id,
        mime: uploaded.mimetype,
        name: uploaded.originalname,
        size: uploaded.size,
        url,
        storage_path: path.join('uploads', uploaded.filename)
      });
    } else if (type === 'video') {
      typedAssetId = randomUUID();
      await insertVideoAsset({
        id: typedAssetId,
        user_id: req.user.id,
        project_id: project.id,
        mime: uploaded.mimetype,
        name: uploaded.originalname,
        size: uploaded.size,
        url,
        storage_path: path.join('uploads', uploaded.filename)
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
exports.getAllProjects = asyncHandler(async (req, res) => {
  const projects = req.user.role === 'admin'
    ? await listProjectsByOwner(req.user.id)
    : await listProjectsByOwner(req.user.id);


  res.status(200).json({
    success: true,
    data: projects
  });
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

  if (project.owner_user_id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to view this project', 401));
  }

  res.status(200).json({ success: true, data: project });
});

// @desc    Update a project
// @route   PUT /api/v1/projects/:id
// @access  Private
exports.updateProject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const project = await getProjectById(id);
  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  if (project.owner_user_id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this project', 401));
  }

  // Disallow updating internal/immutable fields that can cause VersionError
  const disallowed = ['id', 'owner_user_id', 'created_at', 'updated_at', 'last_accessed'];
  const update = { ...req.body };
  for (const key of disallowed) delete update[key];
  await updateProjectRow(id, {
    name: update.name,
    description: update.description,
    thumbnail: update.thumbnail,
    sceneData: update.sceneData,
    isPublic: update.isPublic,
    isArchived: update.isArchived,
  });
  const updated = await getProjectById(id);
  return res.status(200).json({ success: true, data: updated });
});

// @desc    Delete a project
// @route   DELETE /api/v1/projects/:id
// @access  Private
exports.deleteProject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Find the project by ID
  const project = await getProjectById(id);
  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  // Check if the user is authorized to delete the project
  if (project.owner_user_id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this project', 401));
  }

  // Also remove related assets to avoid orphaned records in UI lists
  try {
    const { getPool } = require('../db/mysql');
    const pool = await getPool();
    await pool.execute('DELETE FROM image_assets WHERE project_id = ?', [id]);
    await pool.execute('DELETE FROM video_assets WHERE project_id = ?', [id]);
    await pool.execute('DELETE FROM assets WHERE project_id = ?', [id]);
    await pool.execute('DELETE FROM business_card_logos WHERE project_id = ?', [id]);
    await pool.execute('DELETE FROM business_card_images WHERE project_id = ?', [id]);
    // aggregate business_cards table removed
  } catch (e) {
    console.warn('Warning: failed cleaning assets for project before delete:', e.message);
  }

  // Delete the project row last
  await deleteProjectRow(id);

  res.status(200).json({ success: true, data: {} });
});
