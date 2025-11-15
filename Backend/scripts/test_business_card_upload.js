/**
 * Test Business Card Upload Flow
 * 
 * This script tests the business card upload endpoint to identify issues
 */

require('dotenv').config();
const { getPool, getOrCreateUser, insertAsset, insertImageAsset } = require('../db/mysql');
const { randomUUID } = require('crypto');

async function testUpload() {
  console.log('🧪 Testing Business Card Upload Flow\n');
  
  try {
    // Test 1: Database connection
    console.log('1️⃣  Testing database connection...');
    const pool = await getPool();
    console.log('✅ Database connected\n');
    
    // Test 2: Create test user
    console.log('2️⃣  Testing getOrCreateUser...');
    const testUserId = randomUUID();
    const testEmail = `test-${Date.now()}@example.com`;
    
    try {
      const userId = await getOrCreateUser({
        mongoUserId: testUserId,
        email: testEmail,
        name: 'Test User'
      });
      console.log(`✅ User created/found: ${userId}\n`);
      
      // Test 3: Insert asset
      console.log('3️⃣  Testing insertAsset...');
      const assetId = randomUUID();
      const projectId = randomUUID();
      
      await insertAsset({
        id: assetId,
        user_id: userId,
        project_id: projectId,
        type: 'image',
        mime: 'image/jpeg',
        name: 'test.jpg',
        size: 1024,
        url: 'http://localhost:3005/uploads/test.jpg',
        storage_path: 'uploads/test.jpg'
      });
      console.log(`✅ Asset inserted: ${assetId}\n`);
      
      // Test 4: Insert image asset
      console.log('4️⃣  Testing insertImageAsset...');
      const imageAssetId = randomUUID();
      
      await insertImageAsset({
        id: imageAssetId,
        user_id: userId,
        project_id: projectId,
        mime: 'image/jpeg',
        name: 'test.jpg',
        size: 1024,
        url: 'http://localhost:3005/uploads/test.jpg',
        storage_path: 'uploads/test.jpg'
      });
      console.log(`✅ Image asset inserted: ${imageAssetId}\n`);
      
      // Clean up test data
      console.log('🧹 Cleaning up test data...');
      await pool.execute('DELETE FROM image_assets WHERE id = ?', [imageAssetId]);
      await pool.execute('DELETE FROM assets WHERE id = ?', [assetId]);
      await pool.execute('DELETE FROM app_users WHERE id = ?', [userId]);
      console.log('✅ Test data cleaned up\n');
      
      console.log('='.repeat(50));
      console.log('✨ All tests passed!');
      console.log('='.repeat(50));
      console.log('\nThe business card upload should work now.');
      console.log('If you still get errors, check:');
      console.log('1. Backend server logs for specific error');
      console.log('2. Network tab in browser DevTools');
      console.log('3. Make sure you\'re logged in with a valid token\n');
      
    } catch (userError) {
      console.error('❌ Error in user/asset operations:', userError.message);
      console.error('Stack:', userError.stack);
      throw userError;
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run test
testUpload();

