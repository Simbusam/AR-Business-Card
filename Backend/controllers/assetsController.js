const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const {
  getOrCreateUser,
  getMysqlUserIdByMongo,
  listAssetsByUser,
  listImagesByUser,
  listVideosByUser,
  getLatestImageByUser,
  getLatestVideoByUser,
} = require('../db/mysql');

function parsePagination(req) {
  const limit = Math.min(Number(req.query.limit || 20), 100);
  const page = Math.max(Number(req.query.page || 1), 1);
  const offset = (page - 1) * limit;
  const projectId = req.query.projectId || null;
  const order = (req.query.order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const fromDate = req.query.from || null; // ISO string
  const toDate = req.query.to || null;     // ISO string
  return { limit, page, offset, projectId, order, fromDate, toDate };
}

// Authenticated user assets
exports.getMyImages = asyncHandler(async (req, res, next) => {
  const { limit, offset, page, projectId, order, fromDate, toDate } = parsePagination(req);
  const mysqlUserId = await getOrCreateUser({
    mongoUserId: req.user.id,
    email: req.user.email,
    name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
  });
  const rows = await listImagesByUser({ userId: mysqlUserId, limit, offset, projectId, order, fromDate, toDate });
  res.status(200).json({ success: true, data: rows, meta: { page, limit } });
});

exports.getMyVideos = asyncHandler(async (req, res, next) => {
  const { limit, offset, page, projectId, order, fromDate, toDate } = parsePagination(req);
  const mysqlUserId = await getOrCreateUser({
    mongoUserId: req.user.id,
    email: req.user.email,
    name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
  });
  const rows = await listVideosByUser({ userId: mysqlUserId, limit, offset, projectId, order, fromDate, toDate });
  res.status(200).json({ success: true, data: rows, meta: { page, limit } });
});

exports.getMyAssets = asyncHandler(async (req, res, next) => {
  const { limit, offset, page, projectId, order, fromDate, toDate } = parsePagination(req);
  const type = req.query.type || null; // optional filter: image | video | 3d_model | audio | document
  const mysqlUserId = await getOrCreateUser({
    mongoUserId: req.user.id,
    email: req.user.email,
    name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
  });
  const rows = await listAssetsByUser({ userId: mysqlUserId, type, limit, offset, projectId, order, fromDate, toDate });
  res.status(200).json({ success: true, data: rows, meta: { page, limit } });
});

// Admin: fetch assets for a target Mongo user id
exports.adminGetUserAssets = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Forbidden', 403));
  }
  const mongoUserId = req.params.mongoUserId;
  const { limit, offset, page, projectId, order, fromDate, toDate } = parsePagination(req);
  const type = req.query.type || null;
  const mysqlUserId = await getMysqlUserIdByMongo(mongoUserId);
  if (!mysqlUserId) {
    return res.status(200).json({ success: true, data: [], meta: { page, limit } });
  }
  const rows = await listAssetsByUser({ userId: mysqlUserId, type, limit, offset, projectId, order, fromDate, toDate });
  res.status(200).json({ success: true, data: rows, meta: { page, limit } });
});

// Latest image+video for current user
exports.getMyLatest = asyncHandler(async (req, res, next) => {
  const projectId = req.query.projectId || null;
  const mysqlUserId = await getOrCreateUser({
    mongoUserId: req.user.id,
    email: req.user.email,
    name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
  });
  const latestImage = await getLatestImageByUser({ userId: mysqlUserId, projectId });
  const latestVideo = await getLatestVideoByUser({ userId: mysqlUserId, projectId });
  res.status(200).json({ success: true, data: { image: latestImage, video: latestVideo } });
});

// Admin latest image+video for target user (by Mongo user id)
exports.adminGetUserLatest = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Forbidden', 403));
  }
  const projectId = req.query.projectId || null;
  const mongoUserId = req.params.mongoUserId;
  const mysqlUserId = await getMysqlUserIdByMongo(mongoUserId);
  if (!mysqlUserId) return res.status(200).json({ success: true, data: { image: null, video: null } });
  const latestImage = await getLatestImageByUser({ userId: mysqlUserId, projectId });
  const latestVideo = await getLatestVideoByUser({ userId: mysqlUserId, projectId });
  res.status(200).json({ success: true, data: { image: latestImage, video: latestVideo } });
});
