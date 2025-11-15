/**
 * Test S3 Upload
 * This script tests if files can be uploaded to S3
 */

require('dotenv').config();
const { putObject, bucket } = require('../services/s3');
const fs = require('fs').promises;
const path = require('path');

async function testS3Upload() {
  console.log('\n🧪 Testing S3 Upload...\n');
  console.log('Bucket:', bucket);
  console.log('Region:', process.env.AWS_REGION);
  console.log('');

  try {
    // Create a test file
    const testContent = `Test file created at ${new Date().toISOString()}`;
    const testKey = `test/upload-test-${Date.now()}.txt`;
    
    console.log('📤 Uploading test file...');
    console.log('   Key:', testKey);
    console.log('   Content:', testContent);
    
    await putObject({
      Bucket: bucket,
      Key: testKey,
      Body: Buffer.from(testContent),
      ContentType: 'text/plain'
    });
    
    console.log('✅ Upload successful!');
    
    if (bucket === 'local-bucket') {
      const localPath = path.join(__dirname, '..', 'uploads', testKey);
      console.log('\n📁 File saved locally at:');
      console.log('   ', localPath);
      
      // Verify file exists
      const exists = await fs.access(localPath).then(() => true).catch(() => false);
      if (exists) {
        const content = await fs.readFile(localPath, 'utf-8');
        console.log('✅ File verified!');
        console.log('   Content:', content);
      } else {
        console.log('❌ File not found at expected location');
      }
    } else {
      const url = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${testKey}`;
      console.log('\n☁️  File uploaded to S3:');
      console.log('   ', url);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ S3 Upload Test Passed!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ S3 Upload Test Failed!');
    console.error('Error:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
  
  process.exit(0);
}

testS3Upload();

