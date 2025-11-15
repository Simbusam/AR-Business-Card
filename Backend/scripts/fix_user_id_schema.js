/**
 * Fix User ID Schema
 * 
 * This script updates the user_id column from VARCHAR(10) to VARCHAR(64)
 * to support UUID format user IDs.
 * 
 * Usage: node scripts/fix_user_id_schema.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const {
  MYSQL_HOST = 'localhost',
  MYSQL_PORT = 3306,
  MYSQL_USER = 'root',
  MYSQL_PASSWORD = '',
  MYSQL_DATABASE = 'next_xr'
} = process.env;

async function fixSchema() {
  console.log('🔧 Fixing user ID schema...\n');
  console.log('⚠️  WARNING: This will drop and recreate all tables!');
  console.log('⚠️  All existing data will be lost!\n');

  let connection;

  try {
    connection = await mysql.createConnection({
      host: MYSQL_HOST,
      port: Number(MYSQL_PORT),
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      multipleStatements: true,
    });

    console.log('✅ Connected to MySQL\n');

    // Disable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('⚙️  Disabled foreign key checks\n');

    // Drop all tables in reverse order of dependencies
    console.log('🗑️  Dropping existing tables...');
    await connection.query('DROP TABLE IF EXISTS user_card_sets');
    await connection.query('DROP TABLE IF EXISTS video_assets');
    await connection.query('DROP TABLE IF EXISTS image_assets');
    await connection.query('DROP TABLE IF EXISTS assets');
    await connection.query('DROP TABLE IF EXISTS projects');
    await connection.query('DROP TABLE IF EXISTS app_users');
    console.log('✅ Tables dropped\n');

    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('⚙️  Re-enabled foreign key checks\n');

    console.log('='.repeat(50));
    console.log('✨ Schema reset completed successfully!');
    console.log('='.repeat(50));
    console.log('\n📝 Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Tables will be created automatically with correct schema');
    console.log('3. Register a new user to test\n');

  } catch (error) {
    console.error('\n❌ Error resetting schema:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }

  process.exit(0);
}

// Run fix
fixSchema();

