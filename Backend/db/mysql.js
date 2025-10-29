const mysql = require('mysql2/promise');

const {
  MYSQL_HOST = 'localhost',
  MYSQL_PORT = 3306,
  MYSQL_USER = 'root',
  MYSQL_PASSWORD = '',
  MYSQL_DATABASE = 'next_xr'
} = process.env;

let pool;

async function ensureDatabaseExists() {
  // Connect without selecting a database to create it if missing
  const admin = await mysql.createConnection({
    host: MYSQL_HOST,
    port: Number(MYSQL_PORT),
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    multipleStatements: true,
  });
  try {
    await admin.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`);
    console.log(`[MySQL] Ensured database exists: ${MYSQL_DATABASE}`);
  } finally {
    await admin.end();
  }
}
async function getLatestVideoByUser({ userId, projectId = null }) {
  const p = await getPool();
  const where = ['user_id = ?'];
  const params = [userId];
  if (projectId) { where.push('project_id = ?'); params.push(projectId); }
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const sql = `SELECT id, user_id, project_id, mime, name, size, url, storage_path, created_at
               FROM video_assets
               ${whereSql}
               ORDER BY created_at DESC
               LIMIT 1`;
  const [rows] = await p.execute(sql, params);
  return rows.length ? rows[0] : null;
}
async function listAssetsByProject({ projectId, type = null, limit = 100, offset = 0 }) {
  const p = await getPool();
  const where = ['project_id = ?'];
  const params = [projectId];
  if (type) { where.push('type = ?'); params.push(type); }
  const sql = `SELECT id, user_id, project_id, type, mime, name, size, url, storage_path, created_at
               FROM assets
               WHERE ${where.join(' AND ')}
               ORDER BY created_at DESC
               LIMIT ? OFFSET ?`;
  params.push(Number(limit));
  params.push(Number(offset));
  const [rows] = await p.execute(sql, params);
  return rows;
}

/* removed business_cards helpers */

// =========================
// user_card_sets helpers
// =========================
async function getOrCreateUserCardSet({ userId, projectId }) {
  const p = await getPool();
  const [rows] = await p.execute(`SELECT * FROM user_card_sets WHERE user_id = ? AND project_id = ? LIMIT 1`, [userId, projectId]);
  if (rows.length) return rows[0];
  // Create next code UserNNN for this user
  const [cntRows] = await p.execute(`SELECT COUNT(*) AS c FROM user_card_sets WHERE user_id = ?`, [userId]);
  const next = (cntRows[0]?.c || 0) + 1;
  const code = `User${String(next).padStart(3, '0')}`;
  const { randomUUID } = require('crypto');
  const id = randomUUID();
  await p.execute(`INSERT INTO user_card_sets (id, user_id, project_id, code) VALUES (?, ?, ?, ?)`, [id, userId, projectId, code]);
  return { id, user_id: userId, project_id: projectId, code, logo_asset_id: null, card_image_asset_id: null, video_asset_id: null };
}

async function setUserCardSetSlots({ userId, projectId, logoAssetId = undefined, cardAssetId = undefined, videoAssetId = undefined }) {
  const p = await getPool();
  const fields = [];
  const params = [];
  if (logoAssetId !== undefined) { fields.push('logo_asset_id = ?'); params.push(logoAssetId); }
  if (cardAssetId !== undefined) { fields.push('card_image_asset_id = ?'); params.push(cardAssetId); }
  if (videoAssetId !== undefined) { fields.push('video_asset_id = ?'); params.push(videoAssetId); }
  if (!fields.length) return;
  params.push(userId, projectId);
  await p.execute(`UPDATE user_card_sets SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND project_id = ?`, params);
}

async function insertBusinessCardLogo(row) {
  const p = await getPool();
  const sql = `INSERT INTO business_card_logos (id, project_id, owner_user_id, asset_id, mime, name, size, url, storage_path, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
  await p.execute(sql, [row.id, row.project_id, row.owner_user_id, row.asset_id, row.mime, row.name, row.size, row.url, row.storage_path]);
}

async function insertBusinessCardImage(row) {
  const p = await getPool();
  const sql = `INSERT INTO business_card_images (id, project_id, owner_user_id, asset_id, mime, name, size, url, storage_path, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
  await p.execute(sql, [row.id, row.project_id, row.owner_user_id, row.asset_id, row.mime, row.name, row.size, row.url, row.storage_path]);
}

async function listPublicProjects({ ownerUserId = null, limit = 50, offset = 0 }) {
  const p = await getPool();
  const where = ['is_public = 1', 'is_archived = 0'];
  const params = [];
  if (ownerUserId) { where.push('owner_user_id = ?'); params.push(ownerUserId); }
  const sql = `SELECT id, owner_user_id, name, description, thumbnail, scene_data, is_public, is_archived, updated_at
               FROM projects
               WHERE ${where.join(' AND ')}
               ORDER BY updated_at DESC
               LIMIT ? OFFSET ?`;
  params.push(Number(limit));
  params.push(Number(offset));
  const [rows] = await p.execute(sql, params);
  return rows.map(r => { if (r.scene_data) { try { r.scene_data = JSON.parse(r.scene_data); } catch (_) {} } return r; });
}

async function getPool() {
  if (!pool) {
    // Make sure the target database exists first
    await ensureDatabaseExists();

    pool = mysql.createPool({
      host: MYSQL_HOST,
      port: Number(MYSQL_PORT),
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
    });

    // Ensure tables exist
    // Core users table (MySQL-only auth)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id CHAR(36) NOT NULL PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        password_hash VARCHAR(255) NOT NULL,
        agreed_privacy TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Projects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id CHAR(36) NOT NULL PRIMARY KEY,
        owner_user_id CHAR(36) NOT NULL,
        name VARCHAR(50) NOT NULL,
        description VARCHAR(500) NULL,
        thumbnail TEXT NULL,
        scene_data JSON NULL,
        is_public TINYINT(1) NOT NULL DEFAULT 0,
        is_archived TINYINT(1) NOT NULL DEFAULT 0,
        last_accessed DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_owner (owner_user_id),
        CONSTRAINT fk_projects_owner FOREIGN KEY (owner_user_id) REFERENCES app_users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    /* removed legacy users mapping table */

    await pool.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id CHAR(36) NOT NULL PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        project_id VARCHAR(64) NULL,
        type ENUM('image','video','3d_model','audio','document') NOT NULL,
        mime VARCHAR(128) NOT NULL,
        name VARCHAR(255) NOT NULL,
        size BIGINT NOT NULL,
        url TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Optional: separate tables for images and videos with their own unique IDs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS image_assets (
        id CHAR(36) NOT NULL PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        project_id VARCHAR(64) NULL,
        mime VARCHAR(128) NOT NULL,
        name VARCHAR(255) NOT NULL,
        size BIGINT NOT NULL,
        url TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS video_assets (
        id CHAR(36) NOT NULL PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        project_id VARCHAR(64) NULL,
        mime VARCHAR(128) NOT NULL,
        name VARCHAR(255) NOT NULL,
        size BIGINT NOT NULL,
        url TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    /* removed business_cards aggregate table; using dedicated tables instead */

    // Dedicated tables for logo and business card images
    await pool.query(`
      CREATE TABLE IF NOT EXISTS business_card_logos (
        id CHAR(36) NOT NULL PRIMARY KEY,
        project_id CHAR(36) NOT NULL,
        owner_user_id CHAR(36) NOT NULL,
        asset_id CHAR(36) NOT NULL,
        mime VARCHAR(128) NOT NULL,
        name VARCHAR(255) NOT NULL,
        size BIGINT NOT NULL,
        url TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_bcl_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS business_card_images (
        id CHAR(36) NOT NULL PRIMARY KEY,
        project_id CHAR(36) NOT NULL,
        owner_user_id CHAR(36) NOT NULL,
        asset_id CHAR(36) NOT NULL,
        mime VARCHAR(128) NOT NULL,
        name VARCHAR(255) NOT NULL,
        size BIGINT NOT NULL,
        url TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_bci_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // XR-facing mapping table for common-name slots per user
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_card_sets (
        id CHAR(36) NOT NULL PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        project_id CHAR(36) NOT NULL,
        code VARCHAR(32) NOT NULL UNIQUE,
        logo_asset_id CHAR(36) NULL,
        card_image_asset_id CHAR(36) NULL,
        video_asset_id CHAR(36) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_project (user_id, project_id),
        CONSTRAINT fk_ucs_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_ucs_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log(`[MySQL] Pool ready. DB: ${MYSQL_DATABASE}`);
  }
  return pool;
}

async function insertAsset(row) {
  const p = await getPool();
  const sql = `INSERT INTO assets (id, user_id, project_id, type, mime, name, size, url, storage_path, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
  const params = [
    row.id,
    row.user_id,
    row.project_id || null,
    row.type,
    row.mime,
    row.name,
    row.size,
    row.url,
    row.storage_path
  ];
  await p.execute(sql, params);
}

async function insertImageAsset(row) {
  const p = await getPool();
  const sql = `INSERT INTO image_assets (id, user_id, project_id, mime, name, size, url, storage_path, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
  await p.execute(sql, [row.id, row.user_id, row.project_id || null, row.mime, row.name, row.size, row.url, row.storage_path]);
}

async function insertVideoAsset(row) {
  const p = await getPool();
  const sql = `INSERT INTO video_assets (id, user_id, project_id, mime, name, size, url, storage_path, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
  await p.execute(sql, [row.id, row.user_id, row.project_id || null, row.mime, row.name, row.size, row.url, row.storage_path]);
}

/* removed legacy user mapping helpers */

async function listAssetsByUser({ userId, type = null, limit = 20, offset = 0, projectId = null, fromDate = null, toDate = null, order = 'DESC' }) {
  const p = await getPool();
  const where = ['user_id = ?'];
  const params = [userId];
  if (type) { where.push('type = ?'); params.push(type); }
  if (projectId) { where.push('project_id = ?'); params.push(projectId); }
  if (fromDate) { where.push('created_at >= ?'); params.push(fromDate); }
  if (toDate) { where.push('created_at <= ?'); params.push(toDate); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sql = `SELECT id, user_id, project_id, type, mime, name, size, url, storage_path, created_at
               FROM assets
               ${whereSql}
               ORDER BY created_at ${order === 'ASC' ? 'ASC' : 'DESC'}
               LIMIT ? OFFSET ?`;
  params.push(Number(limit));
  params.push(Number(offset));
  const [rows] = await p.execute(sql, params);
  return rows;
}

async function listImagesByUser(opts) {
  const { userId, limit = 20, offset = 0, projectId = null, fromDate = null, toDate = null, order = 'DESC' } = opts;
  const p = await getPool();
  const where = ['user_id = ?'];
  const params = [userId];
  if (projectId) { where.push('project_id = ?'); params.push(projectId); }
  if (fromDate) { where.push('created_at >= ?'); params.push(fromDate); }
  if (toDate) { where.push('created_at <= ?'); params.push(toDate); }
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const sql = `SELECT id, user_id, project_id, mime, name, size, url, storage_path, created_at
               FROM image_assets
               ${whereSql}
               ORDER BY created_at ${order === 'ASC' ? 'ASC' : 'DESC'}
               LIMIT ? OFFSET ?`;
  params.push(Number(limit));
  params.push(Number(offset));
  const [rows] = await p.execute(sql, params);
  return rows;
}

async function listVideosByUser(opts) {
  const { userId, limit = 20, offset = 0, projectId = null, fromDate = null, toDate = null, order = 'DESC' } = opts;
  const p = await getPool();
  const where = ['user_id = ?'];
  const params = [userId];
  if (projectId) { where.push('project_id = ?'); params.push(projectId); }
  if (fromDate) { where.push('created_at >= ?'); params.push(fromDate); }
  if (toDate) { where.push('created_at <= ?'); params.push(toDate); }
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const sql = `SELECT id, user_id, project_id, mime, name, size, url, storage_path, created_at
               FROM video_assets
               ${whereSql}
               ORDER BY created_at ${order === 'ASC' ? 'ASC' : 'DESC'}
               LIMIT ? OFFSET ?`;
  params.push(Number(limit));
  params.push(Number(offset));
  const [rows] = await p.execute(sql, params);
  return rows;
}

async function getLatestImageByUser({ userId, projectId = null }) {
  const p = await getPool();
  const where = ['user_id = ?'];
  const params = [userId];
  if (projectId) { where.push('project_id = ?'); params.push(projectId); }
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const sql = `SELECT id, user_id, project_id, mime, name, size, url, storage_path, created_at
               FROM image_assets
               ${whereSql}
               ORDER BY created_at DESC
               LIMIT 1`;
  const [rows] = await p.execute(sql, params);
  return rows.length ? rows[0] : null;
}

// =========================
// App Users (MySQL Auth)
// =========================
async function createAppUser({ id, firstName, lastName, email, role = 'user', passwordHash, agreedPrivacy }) {
  const p = await getPool();
  const sql = `INSERT INTO app_users (id, first_name, last_name, email, role, password_hash, agreed_privacy)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
  await p.execute(sql, [id, firstName, lastName, email, role, passwordHash, agreedPrivacy ? 1 : 0]);
}

async function findAppUserByEmail(email) {
  const p = await getPool();
  const [rows] = await p.execute(`SELECT id, first_name, last_name, email, role, password_hash, agreed_privacy, created_at, updated_at FROM app_users WHERE email = ? LIMIT 1`, [email]);
  return rows.length ? rows[0] : null;
}

async function findAppUserById(id) {
  const p = await getPool();
  const [rows] = await p.execute(`SELECT id, first_name, last_name, email, role, created_at, updated_at FROM app_users WHERE id = ? LIMIT 1`, [id]);
  return rows.length ? rows[0] : null;
}

// Compatibility helpers for controllers originally written for Mongo auth
// In this app we use MySQL-only auth with app_users; map the incoming user to MySQL id
async function getOrCreateUser({ mongoUserId, email, name }) {
  // Try find by explicit MySQL id first
  const byId = await findAppUserById(mongoUserId);
  if (byId && byId.id) return byId.id;
  // Then by email
  if (email) {
    const byEmail = await findAppUserByEmail(email);
    if (byEmail && byEmail.id) return byEmail.id;
  }
  // Fallback: assume provided id is already a MySQL id
  return mongoUserId;
}

async function getMysqlUserIdByMongo(mongoUserId) {
  const byId = await findAppUserById(mongoUserId);
  return byId ? byId.id : null;
}

// =========================
// Projects
// =========================
async function createProjectRow({ id, ownerUserId, name, description = null, thumbnail = null, sceneData = null, isPublic = 0, isArchived = 0 }) {
  const p = await getPool();
  const sql = `INSERT INTO projects (id, owner_user_id, name, description, thumbnail, scene_data, is_public, is_archived, last_accessed)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
  await p.execute(sql, [id, ownerUserId, name, description, thumbnail, sceneData ? JSON.stringify(sceneData) : null, isPublic ? 1 : 0, isArchived ? 1 : 0]);
}

async function getProjectById(id) {
  const p = await getPool();
  const [rows] = await p.execute(`SELECT id, owner_user_id, name, description, thumbnail, scene_data, is_public, is_archived, last_accessed, created_at, updated_at FROM projects WHERE id = ? LIMIT 1`, [id]);
  if (!rows.length) return null;
  const row = rows[0];
  if (row.scene_data) {
    try { row.scene_data = JSON.parse(row.scene_data); } catch (_) {}
  }
  return row;
}

async function listProjectsByOwner(ownerUserId) {
  const p = await getPool();
  const [rows] = await p.execute(`SELECT id, owner_user_id, name, description, thumbnail, scene_data, is_public, is_archived, updated_at FROM projects WHERE owner_user_id = ? ORDER BY updated_at DESC`, [ownerUserId]);
  return rows.map(r => {
    if (r.scene_data) { try { r.scene_data = JSON.parse(r.scene_data); } catch (_) {} }
    return r;
  });
}

async function updateProjectRow(id, update) {
  const p = await getPool();
  const fields = [];
  const params = [];
  if (update.name !== undefined) { fields.push('name = ?'); params.push(update.name); }
  if (update.description !== undefined) { fields.push('description = ?'); params.push(update.description); }
  if (update.thumbnail !== undefined) { fields.push('thumbnail = ?'); params.push(update.thumbnail); }
  if (update.sceneData !== undefined) { fields.push('scene_data = ?'); params.push(update.sceneData ? JSON.stringify(update.sceneData) : null); }
  if (update.isPublic !== undefined) { fields.push('is_public = ?'); params.push(update.isPublic ? 1 : 0); }
  if (update.isArchived !== undefined) { fields.push('is_archived = ?'); params.push(update.isArchived ? 1 : 0); }
  if (!fields.length) return;
  const sql = `UPDATE projects SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  params.push(id);
  await p.execute(sql, params);
}

async function deleteProjectRow(id) {
  const p = await getPool();
  await p.execute(`DELETE FROM projects WHERE id = ?`, [id]);
}

module.exports = {
  // pool
  getPool,
  // asset helpers (existing)
  insertAsset,
  insertImageAsset,
  insertVideoAsset,
  listAssetsByUser,
  listImagesByUser,
  listVideosByUser,
  getLatestImageByUser,
  getLatestVideoByUser,
  // new MySQL-only auth and projects
  createAppUser,
  findAppUserByEmail,
  findAppUserById,
  createProjectRow,
  getProjectById,
  listProjectsByOwner,
  listPublicProjects,
  updateProjectRow,
  deleteProjectRow,
  listAssetsByProject,
  // dedicated business card tables
  insertBusinessCardLogo,
  insertBusinessCardImage,
  // XR mapping helpers
  getOrCreateUserCardSet,
  setUserCardSetSlots,
  // auth mapping helpers for assetsController
  getOrCreateUser,
  getMysqlUserIdByMongo,
};
