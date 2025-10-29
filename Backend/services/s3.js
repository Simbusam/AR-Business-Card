const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const region = process.env.AWS_REGION || 'us-east-1';
const s3 = new S3Client({ region, credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY } : undefined });

const putObject = async ({ Bucket, Key, Body, ContentType }) => {
  const cmd = new PutObjectCommand({ Bucket, Key, Body, ContentType });
  return s3.send(cmd);
};

const listObjects = async ({ Bucket, Prefix }) => {
  const cmd = new ListObjectsV2Command({ Bucket, Prefix });
  return s3.send(cmd);
};

module.exports = { s3, putObject, listObjects };
