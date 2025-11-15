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

async function getPool() {
  if (!pool) {
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

    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        project_id VARCHAR(64) NULL,
        type ENUM('image','video','3d_model','audio','document') NOT NULL,
        mime VARCHAR(128) NOT NULL,
        name VARCHAR(255) NOT NULL,
        size BIGINT NOT NULL,
        url TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS image_assets (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        project_id VARCHAR(64) NULL,
        mime VARCHAR(128) NOT NULL,
        name VARCHAR(255) NOT NULL,
        size BIGINT NOT NULL,
        url TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS video_assets (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        project_id VARCHAR(64) NULL,
        mime VARCHAR(128) NOT NULL,
        name VARCHAR(255) NOT NULL,
        size BIGINT NOT NULL,
        url TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Projects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        owner_user_id VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        thumbnail TEXT NULL,
        scene_data JSON NULL,
        is_public TINYINT(1) NOT NULL DEFAULT 0,
        is_archived TINYINT(1) NOT NULL DEFAULT 0,
        views INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_user_id) REFERENCES app_users(id) ON DELETE CASCADE,
        INDEX idx_owner (owner_user_id),
        INDEX idx_public (is_public),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_card_sets (
        id CHAR(36) NOT NULL PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        code VARCHAR(10) NOT NULL UNIQUE,
        project_id VARCHAR(64) NULL,
        logo_asset_id CHAR(36) NULL,
        card_image_asset_id CHAR(36) NULL,
        video_asset_id CHAR(36) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
        FOREIGN KEY (logo_asset_id) REFERENCES assets(id) ON DELETE SET NULL,
        FOREIGN KEY (card_image_asset_id) REFERENCES assets(id) ON DELETE SET NULL,
        FOREIGN KEY (video_asset_id) REFERENCES assets(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log(`[MySQL] Pool ready. DB: ${MYSQL_DATABASE}`);
  }
  return pool;
}

// Auth helpers
async function createAppUser({ id, firstName, lastName, email, role = 'user', passwordHash, agreedPrivacy }) {
  const p = await getPool();
  // Use provided ID (UUID from authController)
  const sql = `INSERT INTO app_users (id, first_name, last_name, email, role, password_hash, agreed_privacy)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
  await p.execute(sql, [id, firstName, lastName, email, role, passwordHash, agreedPrivacy ? 1 : 0]);
  return { id, firstName, lastName, email, role };
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

// Assets helpers
async function getOrCreateUser({ mongoUserId, email, name }) {
  let user = await findAppUserByEmail(email);
  if (!user) {
    const [firstName, lastName] = name.split(' ');
    await createAppUser({
      id: mongoUserId,
      firstName: firstName || '',
      lastName: lastName || '',
      email,
      role: 'user',
      passwordHash: '', // dummy, since auth is elsewhere
      agreedPrivacy: true
    });
    user = await findAppUserByEmail(email);
  }
  return user.id;
}

async function getMysqlUserIdByMongo(mongoUserId) {
  // Return the mongoUserId directly
  return mongoUserId;
}

async function listAssetsByUser({ userId, type, limit, offset, projectId, order, fromDate, toDate }) {
  const p = await getPool();
  let sql = `SELECT id, user_id, project_id, type, mime, name, size, url, storage_path, created_at FROM assets WHERE user_id = ?`;
  const params = [userId];
  if (type) {
    sql += ` AND type = ?`;
    params.push(type);
  }
  if (projectId) {
    sql += ` AND project_id = ?`;
    params.push(projectId);
  }
  if (fromDate) {
    sql += ` AND created_at >= ?`;
    params.push(fromDate);
  }
  if (toDate) {
    sql += ` AND created_at <= ?`;
    params.push(toDate);
  }
  sql += ` ORDER BY created_at ${order} LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  const [rows] = await p.execute(sql, params);
  return rows;
}

async function listImagesByUser({ userId, limit, offset, projectId, order, fromDate, toDate }) {
  const p = await getPool();
  let sql = `SELECT id, user_id, project_id, mime, name, size, url, storage_path, created_at FROM image_assets WHERE user_id = ?`;
  const params = [userId];
  if (projectId) {
    sql += ` AND project_id = ?`;
    params.push(projectId);
  }
  if (fromDate) {
    sql += ` AND created_at >= ?`;
    params.push(fromDate);
  }
  if (toDate) {
    sql += ` AND created_at <= ?`;
    params.push(toDate);
  }
  sql += ` ORDER BY created_at ${order} LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  const [rows] = await p.execute(sql, params);
  return rows;
}

async function listVideosByUser({ userId, limit, offset, projectId, order, fromDate, toDate }) {
  const p = await getPool();
  let sql = `SELECT id, user_id, project_id, mime, name, size, url, storage_path, created_at FROM video_assets WHERE user_id = ?`;
  const params = [userId];
  if (projectId) {
    sql += ` AND project_id = ?`;
    params.push(projectId);
  }
  if (fromDate) {
    sql += ` AND created_at >= ?`;
    params.push(fromDate);
  }
  if (toDate) {
    sql += ` AND created_at <= ?`;
    params.push(toDate);
  }
  sql += ` ORDER BY created_at ${order} LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  const [rows] = await p.execute(sql, params);
  return rows;
}

async function listAssetsByProject({ projectId, limit = 200, offset = 0 }) {
  const p = await getPool();
  const sql = `SELECT id, user_id, project_id, type, mime, name, size, url, storage_path, created_at
               FROM assets WHERE project_id = ?
               ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const [rows] = await p.execute(sql, [projectId, limit, offset]);
  return rows;
}

async function getLatestImageByUser({ userId, projectId }) {
  const p = await getPool();
  let sql = `SELECT id, user_id, project_id, mime, name, size, url, storage_path, created_at FROM image_assets WHERE user_id = ?`;
  const params = [userId];
  if (projectId) {
    sql += ` AND project_id = ?`;
    params.push(projectId);
  }
  sql += ` ORDER BY created_at DESC LIMIT 1`;
  const [rows] = await p.execute(sql, params);
  return rows.length ? rows[0] : null;
}

async function getLatestVideoByUser({ userId, projectId }) {
  const p = await getPool();
  let sql = `SELECT id, user_id, project_id, mime, name, size, url, storage_path, created_at FROM video_assets WHERE user_id = ?`;
  const params = [userId];
  if (projectId) {
    sql += ` AND project_id = ?`;
    params.push(projectId);
  }
  sql += ` ORDER BY created_at DESC LIMIT 1`;
  const [rows] = await p.execute(sql, params);
  return rows.length ? rows[0] : null;
}

async function createAsset({ id, user_id, project_id, type, mime, name, size, url, storage_path }) {
  const p = await getPool();
  const sql = `INSERT INTO assets (id, user_id, project_id, type, mime, name, size, url, storage_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  await p.execute(sql, [id, user_id, project_id, type, mime, name, size, url, storage_path]);
}

async function createImageAsset({ id, user_id, project_id, mime, name, size, url, storage_path }) {
  const p = await getPool();
  const sql = `INSERT INTO image_assets (id, user_id, project_id, mime, name, size, url, storage_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  await p.execute(sql, [id, user_id, project_id, mime, name, size, url, storage_path]);
}

async function createVideoAsset({ id, user_id, project_id, mime, name, size, url, storage_path }) {
  const p = await getPool();
  const sql = `INSERT INTO video_assets (id, user_id, project_id, mime, name, size, url, storage_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  await p.execute(sql, [id, user_id, project_id, mime, name, size, url, storage_path]);
}

// Alias for compatibility
async function insertAsset(params) {
  return createAsset(params);
}

async function insertImageAsset(params) {
  return createImageAsset(params);
}

async function insertVideoAsset(params) {
  return createVideoAsset(params);
}

// Project CRUD functions
async function createProject({ id, owner_user_id, name, description, thumbnail, scene_data, is_public, is_archived }) {
  const p = await getPool();
  const sql = `INSERT INTO projects (id, owner_user_id, name, description, thumbnail, scene_data, is_public, is_archived)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const sceneDataJson = scene_data ? JSON.stringify(scene_data) : null;
  await p.execute(sql, [id, owner_user_id, name, description || null, thumbnail || null, sceneDataJson, is_public ? 1 : 0, is_archived ? 1 : 0]);
  return { id, owner_user_id, name, description, thumbnail, scene_data, is_public, is_archived };
}

async function getProjectById(projectId) {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, owner_user_id, name, description, thumbnail, scene_data, is_public, is_archived, views, created_at, updated_at
     FROM projects WHERE id = ? LIMIT 1`,
    [projectId]
  );
  if (rows.length === 0) return null;
  const project = rows[0];
  // Parse JSON scene_data
  if (project.scene_data && typeof project.scene_data === 'string') {
    try {
      project.scene_data = JSON.parse(project.scene_data);
    } catch (e) {
      project.scene_data = {};
    }
  }
  return project;
}

async function listProjectsByOwner(ownerId, { limit = 50, offset = 0, includeArchived = false } = {}) {
  const p = await getPool();
  let sql = `SELECT id, owner_user_id, name, description, thumbnail, scene_data, is_public, is_archived, views, created_at, updated_at
             FROM projects WHERE owner_user_id = ?`;
  const params = [ownerId];

  if (!includeArchived) {
    sql += ` AND is_archived = 0`;
  }

  sql += ` ORDER BY updated_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const [rows] = await p.execute(sql, params);

  // Parse JSON scene_data for each project
  return rows.map(project => {
    if (project.scene_data && typeof project.scene_data === 'string') {
      try {
        project.scene_data = JSON.parse(project.scene_data);
      } catch (e) {
        project.scene_data = {};
      }
    }
    return project;
  });
}

async function listPublicProjects({ limit = 50, offset = 0 } = {}) {
  const p = await getPool();
  const sql = `SELECT id, owner_user_id, name, description, thumbnail, scene_data, is_public, is_archived, views, created_at, updated_at
               FROM projects WHERE is_public = 1 AND is_archived = 0
               ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const [rows] = await p.execute(sql, [limit, offset]);

  return rows.map(project => {
    if (project.scene_data && typeof project.scene_data === 'string') {
      try {
        project.scene_data = JSON.parse(project.scene_data);
      } catch (e) {
        project.scene_data = {};
      }
    }
    return project;
  });
}

async function updateProject(projectId, updates) {
  const p = await getPool();
  const allowedFields = ['name', 'description', 'thumbnail', 'scene_data', 'is_public', 'is_archived', 'views'];
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = ?`);
      if (key === 'scene_data' && value !== null) {
        values.push(JSON.stringify(value));
      } else if (key === 'is_public' || key === 'is_archived') {
        values.push(value ? 1 : 0);
      } else {
        values.push(value);
      }
    }
  }

  if (fields.length === 0) return null;

  values.push(projectId);
  const sql = `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`;
  await p.execute(sql, values);

  return getProjectById(projectId);
}

async function deleteProject(projectId) {
  const p = await getPool();
  await p.execute('DELETE FROM projects WHERE id = ?', [projectId]);
}

async function incrementProjectViews(projectId) {
  const p = await getPool();
  await p.execute('UPDATE projects SET views = views + 1 WHERE id = ?', [projectId]);
}

// Fetch a single asset by projectId
async function getAssetByProjectId(projectId) {
  const [rows] = await pool.query(
    'SELECT * FROM assets WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
    [projectId]
  );
  return rows[0];
}


module.exports = {
  getPool,
  createAppUser,
  findAppUserByEmail,
  findAppUserById,
  getOrCreateUser,
  getAssetByProjectId,
  getMysqlUserIdByMongo,
  listAssetsByUser,
  listImagesByUser,
  listVideosByUser,
  listAssetsByProject,
  getLatestImageByUser,
  getLatestVideoByUser,
  createAsset,
  createImageAsset,
  createVideoAsset,
  insertAsset,
  insertImageAsset,
  insertVideoAsset,
  getProjectById,
  listProjectsByOwner,
  listPublicProjects,
  createProject,
  updateProject,
  deleteProject,
  incrementProjectViews,
};
