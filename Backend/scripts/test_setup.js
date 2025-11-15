/**
 * Test Setup Script
 * 
 * This script tests the MySQL and AWS S3 connections
 * 
 * Usage: node scripts/test_setup.js
 */

require('dotenv').config();
const { getPool } = require('../db/mysql');
const { s3, bucket, putObject, listObjects } = require('../services/s3');

async function testMySQL() {
  console.log('\n🔍 Testing MySQL Connection...');
  try {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log('✅ MySQL connection successful!');
    console.log(`   Result: ${rows[0].result}`);
    
    // Check tables
    const [tables] = await pool.query('SHOW TABLES');
    console.log(`✅ Found ${tables.length} tables:`);
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });
    
    // Check user count
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM app_users');
    console.log(`✅ Users in database: ${userCount[0].count}`);
    
    // Check project count
    const [projectCount] = await pool.query('SELECT COUNT(*) as count FROM projects');
    console.log(`✅ Projects in database: ${projectCount[0].count}`);
    
    // Check asset count
    const [assetCount] = await pool.query('SELECT COUNT(*) as count FROM assets');
    console.log(`✅ Assets in database: ${assetCount[0].count}`);
    
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    return false;
  }
}

async function testS3() {
  console.log('\n🔍 Testing AWS S3 Connection...');
  
  if (bucket === 'local-bucket') {
    console.log('⚠️  Using local storage (local-bucket mode)');
    console.log('   Files will be stored in Backend/uploads/');
    console.log('   To use AWS S3, set S3_BUCKET in .env');
    return true;
  }
  
  try {
    // Test S3 connection by listing objects
    console.log(`   Bucket: ${bucket}`);
    console.log(`   Region: ${process.env.AWS_REGION}`);
    
    const result = await listObjects({ Bucket: bucket, Prefix: '' });
    console.log('✅ AWS S3 connection successful!');
    console.log(`   Files in bucket: ${result.Contents ? result.Contents.length : 0}`);
    
    // Test write permission (optional)
    const testKey = 'test/connection-test.txt';
    const testContent = `Connection test at ${new Date().toISOString()}`;
    
    try {
      await putObject({
        Bucket: bucket,
        Key: testKey,
        Body: Buffer.from(testContent),
        ContentType: 'text/plain'
      });
      console.log('✅ S3 write permission verified');
    } catch (writeError) {
      console.log('⚠️  S3 write test failed:', writeError.message);
      console.log('   Check bucket permissions');
    }
    
    return true;
  } catch (error) {
    console.error('❌ AWS S3 connection failed:', error.message);
    console.error('   Check your AWS credentials and bucket configuration');
    return false;
  }
}

async function testEnvironment() {
  console.log('\n🔍 Checking Environment Variables...');
  
  const required = [
    'MYSQL_HOST',
    'MYSQL_USER',
    'MYSQL_DATABASE',
    'JWT_SECRET',
    'PORT'
  ];
  
  const optional = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'S3_BUCKET',
    'AWS_REGION'
  ];
  
  let allPresent = true;
  
  console.log('\n📋 Required variables:');
  required.forEach(key => {
    if (process.env[key]) {
      console.log(`   ✅ ${key}: ${key.includes('SECRET') || key.includes('PASSWORD') ? '****' : process.env[key]}`);
    } else {
      console.log(`   ❌ ${key}: MISSING`);
      allPresent = false;
    }
  });
  
  console.log('\n📋 Optional variables (for AWS S3):');
  optional.forEach(key => {
    if (process.env[key]) {
      console.log(`   ✅ ${key}: ${key.includes('SECRET') || key.includes('KEY') ? '****' : process.env[key]}`);
    } else {
      console.log(`   ⚠️  ${key}: Not set (using local storage)`);
    }
  });
  
  return allPresent;
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 AR Business Card - Setup Test');
  console.log('='.repeat(60));
  
  const envOk = await testEnvironment();
  const mysqlOk = await testMySQL();
  const s3Ok = await testS3();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary:');
  console.log('='.repeat(60));
  console.log(`Environment Variables: ${envOk ? '✅ OK' : '❌ FAILED'}`);
  console.log(`MySQL Connection: ${mysqlOk ? '✅ OK' : '❌ FAILED'}`);
  console.log(`S3 Connection: ${s3Ok ? '✅ OK' : '⚠️  WARNING'}`);
  console.log('='.repeat(60));
  
  if (envOk && mysqlOk) {
    console.log('\n✨ Setup is ready! You can start the server now.');
  } else {
    console.log('\n⚠️  Please fix the issues above before starting the server.');
  }
  
  process.exit(envOk && mysqlOk ? 0 : 1);
}

// Run tests
runTests();

