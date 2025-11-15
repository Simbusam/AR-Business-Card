/**
 * Check Media Data
 * This script checks if media data exists in MySQL and shows user IDs
 */

require('dotenv').config();
const { getPool } = require('../db/mysql');

async function checkMediaData() {
  console.log('\n🔍 Checking Media Data in MySQL...\n');
  
  try {
    const pool = await getPool();
    
    // Check users
    console.log('👥 USERS:');
    console.log('='.repeat(80));
    const [users] = await pool.execute('SELECT id, email, first_name, last_name FROM app_users');
    if (users.length === 0) {
      console.log('❌ No users found!');
    } else {
      users.forEach((user, idx) => {
        console.log(`${idx + 1}. ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.first_name} ${user.last_name}`);
        console.log('');
      });
    }
    
    // Check image assets
    console.log('\n📸 IMAGE ASSETS:');
    console.log('='.repeat(80));
    const [images] = await pool.execute('SELECT id, user_id, name, url, size, created_at FROM image_assets ORDER BY created_at DESC LIMIT 10');
    if (images.length === 0) {
      console.log('❌ No image assets found!');
    } else {
      console.log(`✅ Found ${images.length} image assets\n`);
      images.forEach((img, idx) => {
        console.log(`${idx + 1}. ${img.name}`);
        console.log(`   ID: ${img.id}`);
        console.log(`   User ID: ${img.user_id}`);
        console.log(`   Size: ${(img.size / 1024).toFixed(2)} KB`);
        console.log(`   URL: ${img.url}`);
        console.log(`   Created: ${img.created_at}`);
        console.log('');
      });
    }
    
    // Check video assets
    console.log('\n🎥 VIDEO ASSETS:');
    console.log('='.repeat(80));
    const [videos] = await pool.execute('SELECT id, user_id, name, url, size, created_at FROM video_assets ORDER BY created_at DESC LIMIT 10');
    if (videos.length === 0) {
      console.log('❌ No video assets found!');
    } else {
      console.log(`✅ Found ${videos.length} video assets\n`);
      videos.forEach((vid, idx) => {
        console.log(`${idx + 1}. ${vid.name}`);
        console.log(`   ID: ${vid.id}`);
        console.log(`   User ID: ${vid.user_id}`);
        console.log(`   Size: ${(vid.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   URL: ${vid.url}`);
        console.log(`   Created: ${vid.created_at}`);
        console.log('');
      });
    }
    
    // Check for user ID mismatches
    console.log('\n🔍 USER ID ANALYSIS:');
    console.log('='.repeat(80));
    
    const [imageUserIds] = await pool.execute('SELECT DISTINCT user_id FROM image_assets');
    const [videoUserIds] = await pool.execute('SELECT DISTINCT user_id FROM video_assets');
    
    const allAssetUserIds = new Set([
      ...imageUserIds.map(r => r.user_id),
      ...videoUserIds.map(r => r.user_id)
    ]);
    
    const registeredUserIds = new Set(users.map(u => u.id));
    
    console.log('Registered Users:', Array.from(registeredUserIds));
    console.log('Asset User IDs:', Array.from(allAssetUserIds));
    
    const orphanedUserIds = Array.from(allAssetUserIds).filter(id => !registeredUserIds.has(id));
    if (orphanedUserIds.length > 0) {
      console.log('\n⚠️  WARNING: Found assets with non-existent user IDs:');
      orphanedUserIds.forEach(id => console.log(`   - ${id}`));
      console.log('\nThese assets won\'t show up in the media page!');
      console.log('Fix: Update user_id to a valid user ID');
    } else {
      console.log('\n✅ All assets have valid user IDs');
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('='.repeat(80));
    console.log(`Users: ${users.length}`);
    console.log(`Image Assets: ${images.length}`);
    console.log(`Video Assets: ${videos.length}`);
    console.log(`Total Assets: ${images.length + videos.length}`);
    
    if (users.length > 0 && (images.length > 0 || videos.length > 0)) {
      console.log('\n✅ Data exists! If media page is empty, check:');
      console.log('   1. Are you logged in with the correct user?');
      console.log('   2. Does the logged-in user ID match the asset user_id?');
      console.log('   3. Check browser console for API call logs');
      console.log('   4. Check backend console for API request logs');
    } else if (users.length === 0) {
      console.log('\n❌ No users found! Register a user first.');
    } else {
      console.log('\n❌ No assets found! Upload some files first.');
    }
    
    console.log('\n' + '='.repeat(80));
    
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkMediaData();

