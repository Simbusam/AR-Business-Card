// controllers/arController.js
const { getProjectById, listPublicProjects, listProjectsByOwner, listAssetsByProject } = require('../db/mysql');
const ErrorResponse = require('../utils/errorResponse');
const { generateARHTML, saveARFile, arFileExists } = require('../services/arGenerator');
const path = require('path');

// Normalize projection depending on what AR team needs
// For MySQL rows, we'll shape response objects
const toProjectDto = (row) => ({
  id: row.id,
  owner: row.owner_user_id,
  name: row.name,
  description: row.description,
  thumbnail: row.thumbnail,
  isPublic: !!row.is_public,
  isArchived: !!row.is_archived,
  updatedAt: row.updated_at,
});

function canReadProject(project, req) {
  // Public always allowed; private allowed with valid API key
  if (project.isPublic) return true;
  if (req.apiKeyValid) return true;
  return false;
}

exports.listProjects = async function listProjects(req, res, next) {
  try {
    const { owner, limit = 50, offset = 0, all } = req.query;
    let rows;
    if (!req.apiKeyValid || all !== '1') {
      rows = await listPublicProjects({ ownerUserId: owner || null, limit: Number(limit), offset: Number(offset) });
    } else if (owner) {
      rows = await listProjectsByOwner(owner);
    } else {
      // default to public if no owner specified
      rows = await listPublicProjects({ limit: Number(limit), offset: Number(offset) });
    }
    res.status(200).json({ success: true, data: rows.map(toProjectDto) });
  } catch (err) {
    next(err);
  }
};

exports.getProject = async function getProject(req, res, next) {
  try {
    const { id } = req.params;
    const row = await getProjectById(id);
    if (!row) return next(new ErrorResponse('Project not found', 404));
    const project = {
      ...toProjectDto(row),
      sceneData: row.scene_data || {},
    };
    if (!canReadProject(project, req)) {
      return next(new ErrorResponse('Not authorized to access this resource', 403));
    }
    res.status(200).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

exports.getScene = async function getScene(req, res, next) {
  try {
    const { id } = req.params;
    const row = await getProjectById(id);
    if (!row) return next(new ErrorResponse('Project not found', 404));
    const project = { isPublic: !!row.is_public };
    if (!canReadProject(project, req)) {
      return next(new ErrorResponse('Not authorized to access this resource', 403));
    }
    res.status(200).json({ success: true, data: { sceneData: row.scene_data || {}, updatedAt: row.updated_at } });
  } catch (err) {
    next(err);
  }
};

exports.getAssets = async function getAssets(req, res, next) {
  try {
    const { id } = req.params;
    const row = await getProjectById(id);
    if (!row) return next(new ErrorResponse('Project not found', 404));
    const project = { isPublic: !!row.is_public };
    if (!canReadProject(project, req)) {
      return next(new ErrorResponse('Not authorized to access this resource', 403));
    }
    const assets = await listAssetsByProject({ projectId: id, limit: 200, offset: 0 });
    res.status(200).json({ success: true, data: { assets, updatedAt: row.updated_at } });
  } catch (err) {
    next(err);
  }
};

/**
 * Generate AR Experience for a project
 * Creates dynamic MindAR HTML file with project's card image and video
 */
exports.generateARExperience = async function generateARExperience(req, res, next) {
  try {
    const { projectId } = req.params;

    console.log(`🎨 Generating AR experience for project: ${projectId}`);

    // Get project details
    const project = await getProjectById(projectId);
    if (!project) {
      return next(new ErrorResponse('Project not found', 404));
    }

    // Get project assets
    const assets = await listAssetsByProject({ projectId, limit: 200, offset: 0 });

    // Find Card.jpg and Video.mp4
    const cardAsset = assets.find(a => a.name === 'Card.jpg' || a.type === 'image');
    const videoAsset = assets.find(a => a.name === 'Video.mp4' || a.type === 'video');

    if (!cardAsset) {
      return next(new ErrorResponse('Card image not found. Please upload Card.jpg first.', 400));
    }

    if (!videoAsset) {
      return next(new ErrorResponse('Video not found. Please upload Video.mp4 first.', 400));
    }

    console.log(`✅ Found assets - Card: ${cardAsset.url}, Video: ${videoAsset.url}`);

    // Generate HTML content
    const htmlContent = generateARHTML(projectId, cardAsset.url, videoAsset.url);

    // Save to disk
    const filePath = await saveARFile(projectId, htmlContent);

    console.log(`✅ AR experience generated: ${filePath}`);

    res.status(200).json({
      success: true,
      message: 'AR experience generated successfully',
      data: {
        projectId,
        arUrl: `/ar-view/${projectId}`,
        cardImage: cardAsset.url,
        video: videoAsset.url
      }
    });

  } catch (err) {
    console.error('❌ Error generating AR experience:', err);
    next(err);
  }
};

/**
 * Check if AR experience exists for a project
 */
exports.checkARExperience = async function checkARExperience(req, res, next) {
  try {
    const { projectId } = req.params;

    const exists = await arFileExists(projectId);

    res.status(200).json({
      success: true,
      data: {
        projectId,
        arGenerated: exists,
        arUrl: exists ? `/ar-view/${projectId}` : null
      }
    });

  } catch (err) {
    next(err);
  }
};
