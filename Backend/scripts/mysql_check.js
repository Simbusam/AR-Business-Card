// One-off MySQL connectivity and table check for next_xr
const mysql = require('mysql2/promise');

const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_PORT = Number(process.env.MYSQL_PORT || 3306);
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'next_xr';

(async () => {
  try {
    // Create DB if missing
    const admin = await mysql.createConnection({
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      multipleStatements: true,
    });
    await admin.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`);
    console.log(`[check] ensured database exists: ${MYSQL_DATABASE}`);
    await admin.end();

    const pool = await mysql.createPool({
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 2,
    });

    // Create the 4 tables if missing
    const ddl = [
      `CREATE TABLE IF NOT EXISTS users (
        id CHAR(36) NOT NULL PRIMARY KEY,
        mongo_user_id VARCHAR(64) NOT NULL UNIQUE,
        email VARCHAR(255) NULL,
        name VARCHAR(255) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      `CREATE TABLE IF NOT EXISTS assets (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      `CREATE TABLE IF NOT EXISTS image_assets (
        id CHAR(36) NOT NULL PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        project_id VARCHAR(64) NULL,
        mime VARCHAR(128) NOT NULL,
        name VARCHAR(255) NOT NULL,
        size BIGINT NOT NULL,
        url TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      `CREATE TABLE IF NOT EXISTS video_assets (
        id CHAR(36) NOT NULL PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        project_id VARCHAR(64) NULL,
        mime VARCHAR(128) NOT NULL,
        name VARCHAR(255) NOT NULL,
        size BIGINT NOT NULL,
        url TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    ];

    for (const sql of ddl) {
      await pool.query(sql);
    }

    const [tables] = await pool.query('SHOW TABLES');
    console.log('[check] SHOW TABLES =>', tables);

    await pool.end();
    console.log('[check] success');
    process.exit(0);
  } catch (err) {
    console.error('[check] ERROR:', err.message);
    process.exit(1);
  }
})();
