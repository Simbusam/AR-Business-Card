/**
 * Check S3 Bucket Region
 * This script helps identify the correct region for your S3 bucket
 */

require('dotenv').config();
const { S3Client, HeadBucketCommand, GetBucketLocationCommand } = require('@aws-sdk/client-s3');

const bucketName = process.env.S3_BUCKET || 'ar-business-card-sam';

async function checkBucket() {
  console.log('\n🔍 Checking S3 Bucket Configuration...\n');
  console.log(`Bucket Name: ${bucketName}`);
  console.log(`Current Region Setting: ${process.env.AWS_REGION || 'ap-south-1'}\n`);

  // Try different regions
  const regions = [
    'us-east-1',
    'us-east-2', 
    'us-west-1',
    'us-west-2',
    'ap-south-1',
    'ap-southeast-1',
    'ap-southeast-2',
    'eu-west-1',
    'eu-central-1',
    'eu-north-1'
  ];

  console.log('🔎 Trying to find the correct region...\n');

  for (const region of regions) {
    try {
      const s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });

      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      
      console.log('✅ SUCCESS! Found the bucket!');
      console.log('='.repeat(60));
      console.log(`Bucket: ${bucketName}`);
      console.log(`Region: ${region}`);
      console.log('='.repeat(60));
      console.log('\n📝 Update your .env file:');
      console.log(`AWS_REGION=${region}`);
      console.log('\nThen restart your backend server.\n');
      process.exit(0);
      
    } catch (error) {
      // Continue to next region
      process.stdout.write(`❌ ${region} ... `);
      console.log('not here');
    }
  }

  console.log('\n❌ Could not find the bucket in any common region.');
  console.log('\nPossible issues:');
  console.log('1. Bucket name is incorrect');
  console.log('2. AWS credentials are invalid');
  console.log('3. Bucket is in a different region not checked');
  console.log('\nFor now, use local storage:');
  console.log('Set in .env: S3_BUCKET=local-bucket\n');
  
  process.exit(1);
}

checkBucket();

