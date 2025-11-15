/**
 * Test S3 Access
 * This script tests if S3 files are publicly accessible
 */

require('dotenv').config();
const https = require('https');

const testUrls = [
  'https://ar-business-card-sam.s3.eu-north-1.amazonaws.com/c190251a-747b-4cf0-8cee-8bf34ffa0540/projectae49603b-2cf5-4192-a672-da34c34328df/assets/images/Card.jpg',
  'https://ar-business-card-sam.s3.eu-north-1.amazonaws.com/c190251a-747b-4cf0-8cee-8bf34ffa0540/projectae49603b-2cf5-4192-a672-da34c34328df/assets/content/Video.webm'
];

async function testUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      const { statusCode, headers } = res;
      
      // Consume response data to free up memory
      res.resume();
      
      resolve({
        url,
        statusCode,
        contentType: headers['content-type'],
        accessControlAllowOrigin: headers['access-control-allow-origin'],
        success: statusCode === 200
      });
    }).on('error', (err) => {
      resolve({
        url,
        error: err.message,
        success: false
      });
    });
  });
}

async function testS3Access() {
  console.log('\n🧪 Testing S3 Access...\n');
  console.log('='.repeat(80));
  
  for (const url of testUrls) {
    console.log('\n📍 Testing URL:');
    console.log('   ' + url);
    console.log('');
    
    const result = await testUrl(url);
    
    if (result.error) {
      console.log('❌ ERROR:', result.error);
    } else {
      console.log('Status Code:', result.statusCode);
      console.log('Content-Type:', result.contentType);
      console.log('CORS Header:', result.accessControlAllowOrigin || 'NOT SET');
      
      if (result.statusCode === 200) {
        console.log('✅ File is accessible!');
        if (!result.accessControlAllowOrigin) {
          console.log('⚠️  WARNING: CORS header not set - may cause issues in browser');
        }
      } else if (result.statusCode === 403) {
        console.log('❌ Access Denied - S3 bucket is not public!');
        console.log('\n🔧 FIX NEEDED:');
        console.log('   1. Go to AWS Console → S3 → ar-business-card-sam');
        console.log('   2. Permissions → Block public access → Edit → Uncheck all');
        console.log('   3. Bucket policy → Add public read policy');
        console.log('   4. CORS → Add CORS configuration');
        console.log('\n   See S3_PERMISSIONS_FIX_TAMIL.md for detailed steps');
      } else if (result.statusCode === 404) {
        console.log('❌ File Not Found - File does not exist in S3!');
        console.log('\n🔧 FIX NEEDED:');
        console.log('   1. Check if file was uploaded successfully');
        console.log('   2. Verify S3 key/path is correct');
        console.log('   3. Check AWS Console to see if file exists');
      } else {
        console.log('⚠️  Unexpected status code:', result.statusCode);
      }
    }
    
    console.log('');
  }
  
  console.log('='.repeat(80));
  console.log('\n📋 SUMMARY:\n');
  
  const results = await Promise.all(testUrls.map(testUrl));
  const accessible = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`Accessible: ${accessible}/${total}`);
  
  if (accessible === total) {
    console.log('\n✅ All files are accessible!');
    console.log('If images still not loading in browser, check:');
    console.log('   1. Browser console for CORS errors');
    console.log('   2. Clear browser cache (Ctrl+Shift+R)');
    console.log('   3. Check if CORS is configured in S3');
  } else {
    console.log('\n❌ Some files are not accessible!');
    console.log('\n🔧 QUICK FIX:');
    console.log('\n1. AWS Console → S3 → ar-business-card-sam → Permissions');
    console.log('\n2. Block public access → Edit → Uncheck all → Save');
    console.log('\n3. Bucket policy → Edit → Paste this:');
    console.log('\n{');
    console.log('  "Version": "2012-10-17",');
    console.log('  "Statement": [{');
    console.log('    "Effect": "Allow",');
    console.log('    "Principal": "*",');
    console.log('    "Action": "s3:GetObject",');
    console.log('    "Resource": "arn:aws:s3:::ar-business-card-sam/*"');
    console.log('  }]');
    console.log('}');
    console.log('\n4. CORS → Edit → Paste this:');
    console.log('\n[{');
    console.log('  "AllowedHeaders": ["*"],');
    console.log('  "AllowedMethods": ["GET", "HEAD"],');
    console.log('  "AllowedOrigins": ["*"],');
    console.log('  "MaxAgeSeconds": 3000');
    console.log('}]');
    console.log('\n5. Save and test again');
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
  process.exit(accessible === total ? 0 : 1);
}

testS3Access();

