// controllers/arController.js
const { getProjectById, listPublicProjects, listProjectsByOwner, listAssetsByProject } = require('../db/mysql');
const ErrorResponse = require('../utils/errorResponse');

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
