/**
 * Migration Script: S3 Projects to MySQL
 * 
 * This script migrates existing projects from S3 JSON files to MySQL database.
 * Run this once to migrate existing data.
 * 
 * Usage: node scripts/migrate_projects_to_mysql.js
 */

require('dotenv').config();
const { getPool, createProject } = require('../db/mysql');
const { listObjects, getJson } = require('../services/s3');

const bucket = process.env.S3_BUCKET || 'local-bucket';
const basePrefix = process.env.S3_BASE_PREFIX ? 
  (process.env.S3_BASE_PREFIX.endsWith('/') ? process.env.S3_BASE_PREFIX : process.env.S3_BASE_PREFIX + '/') : '';

async function migrateProjects() {
  console.log('🚀 Starting project migration from S3 to MySQL...\n');
  
  try {
    // Initialize MySQL connection
    await getPool();
    console.log('✅ MySQL connection established\n');
    
    // List all project.json files in S3
    console.log('📂 Scanning S3 for project files...');
    const result = await listObjects({ Bucket: bucket, Prefix: basePrefix });
    
    if (!result.Contents || result.Contents.length === 0) {
      console.log('⚠️  No files found in S3');
      return;
    }
    
    // Filter for project.json files
    const projectKeys = result.Contents
      .map(obj => obj.Key)
      .filter(key => key.endsWith('/meta/project.json'));
    
    console.log(`📊 Found ${projectKeys.length} project(s) to migrate\n`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    // Migrate each project
    for (const key of projectKeys) {
      try {
        console.log(`Processing: ${key}`);
        
        // Get project data from S3
        const projectData = await getJson({ Bucket: bucket, Key: key });
        
        // Check if project already exists in MySQL
        const pool = await getPool();
        const [existing] = await pool.execute(
          'SELECT id FROM projects WHERE id = ? LIMIT 1',
          [projectData.id]
        );
        
        if (existing.length > 0) {
          console.log(`  ⏭️  Skipped (already exists): ${projectData.name}`);
          skipCount++;
          continue;
        }
        
        // Create project in MySQL
        await createProject({
          id: projectData.id,
          owner_user_id: projectData.owner_user_id,
          name: projectData.name || 'Untitled Project',
          description: projectData.description || null,
          thumbnail: projectData.thumbnail || null,
          scene_data: projectData.scene_data || {},
          is_public: projectData.is_public || 0,
          is_archived: projectData.is_archived || 0,
        });
        
        console.log(`  ✅ Migrated: ${projectData.name}`);
        successCount++;
        
      } catch (error) {
        console.error(`  ❌ Error migrating ${key}:`, error.message);
        errorCount++;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`⏭️  Skipped (already exist): ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📁 Total processed: ${projectKeys.length}`);
    console.log('='.repeat(50));
    
    if (successCount > 0) {
      console.log('\n✨ Migration completed successfully!');
    } else if (skipCount === projectKeys.length) {
      console.log('\n✨ All projects already migrated!');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please check the logs above.');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run migration
migrateProjects();

