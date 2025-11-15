/**
 * Clear All Data
 * This script clears all projects, assets, and user data from MySQL
 * WARNING: This will delete ALL data!
 */

require('dotenv').config();
const { getPool } = require('../db/mysql');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function clearAllData() {
  console.log('\n⚠️  WARNING: This will delete ALL data from MySQL!');
  console.log('='.repeat(80));
  console.log('This will clear:');
  console.log('  - All projects');
  console.log('  - All assets (images, videos)');
  console.log('  - All users (optional)');
  console.log('='.repeat(80));
  
  rl.question('\nDo you want to delete USERS too? (y/n): ', async (deleteUsers) => {
    const shouldDeleteUsers = deleteUsers.toLowerCase() === 'y';
    
    rl.question('\nAre you sure? Type "DELETE ALL" to confirm: ', async (answer) => {
      if (answer !== 'DELETE ALL') {
        console.log('\n❌ Cancelled. No data was deleted.');
        rl.close();
        process.exit(0);
      }
      
      try {
        const pool = await getPool();
        
        console.log('\n🗑️  Deleting data...\n');
        
        // Delete in correct order (foreign key constraints)
        
        // 1. Delete video assets
        console.log('1. Deleting video assets...');
        const [videoResult] = await pool.execute('DELETE FROM video_assets');
        console.log(`   ✅ Deleted ${videoResult.affectedRows} video assets`);
        
        // 2. Delete image assets
        console.log('2. Deleting image assets...');
        const [imageResult] = await pool.execute('DELETE FROM image_assets');
        console.log(`   ✅ Deleted ${imageResult.affectedRows} image assets`);
        
        // 3. Delete assets
        console.log('3. Deleting assets...');
        const [assetResult] = await pool.execute('DELETE FROM assets');
        console.log(`   ✅ Deleted ${assetResult.affectedRows} assets`);
        
        // 4. Delete projects
        console.log('4. Deleting projects...');
        const [projectResult] = await pool.execute('DELETE FROM projects');
        console.log(`   ✅ Deleted ${projectResult.affectedRows} projects`);
        
        // 5. Delete users (optional)
        if (shouldDeleteUsers) {
          console.log('5. Deleting users...');
          const [userResult] = await pool.execute('DELETE FROM app_users');
          console.log(`   ✅ Deleted ${userResult.affectedRows} users`);
        } else {
          console.log('5. Keeping users (not deleted)');
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('✨ All data cleared successfully!');
        console.log('='.repeat(80));
        
        // Show remaining data
        console.log('\n📊 Remaining data:');
        const [users] = await pool.execute('SELECT COUNT(*) as count FROM app_users');
        const [projects] = await pool.execute('SELECT COUNT(*) as count FROM projects');
        const [assets] = await pool.execute('SELECT COUNT(*) as count FROM assets');
        const [images] = await pool.execute('SELECT COUNT(*) as count FROM image_assets');
        const [videos] = await pool.execute('SELECT COUNT(*) as count FROM video_assets');
        
        console.log(`  Users: ${users[0].count}`);
        console.log(`  Projects: ${projects[0].count}`);
        console.log(`  Assets: ${assets[0].count}`);
        console.log(`  Image Assets: ${images[0].count}`);
        console.log(`  Video Assets: ${videos[0].count}`);
        
        await pool.end();
        rl.close();
        process.exit(0);
        
      } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        rl.close();
        process.exit(1);
      }
    });
  });
}

clearAllData();

