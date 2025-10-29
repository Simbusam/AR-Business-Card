const AWS = require('aws-sdk');

// Load AWS credentials and set region from environment variables or config
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1', // Change region as needed
});

const s3 = new AWS.S3();

module.exports = s3;