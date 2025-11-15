const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const region = process.env.AWS_REGION || 'ap-south-1'; // Use region from env
const s3 = new S3Client({
  region,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY }
    : undefined,
});

const bucket = process.env.S3_BUCKET || 'local-bucket'; // Use S3 if configured, else local

// Helper to get S3 URL for a key
const getS3Url = (key) => {
  if (bucket === 'local-bucket') {
    return `http://localhost:${process.env.PORT || 3005}/uploads/${key}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fsSync.existsSync(dirPath)) return arrayOfFiles;
  const files = fsSync.readdirSync(dirPath);
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fsSync.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath.replace(/\\/g, '/')); // Normalize to forward slashes
    }
  });
  return arrayOfFiles;
}

const putObject = async ({ Bucket, Key, Body, ContentType }) => {
  console.log('📤 putObject called');
  console.log('   Bucket:', Bucket);
  console.log('   Key:', Key);
  console.log('   ContentType:', ContentType);
  console.log('   Body size:', Body ? Body.length : 0, 'bytes');

  if (Bucket === 'local-bucket') {
    console.log('💾 Using local storage');
    const localPath = path.join(__dirname, '..', 'uploads', Key);
    console.log('   Local path:', localPath);
    console.log('   Creating directory...');
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    console.log('   Writing file...');
    await fs.writeFile(localPath, Body);
    console.log('✅ File saved locally');
    return { success: true };
  }

  console.log('☁️  Uploading to AWS S3...');
  const cmd = new PutObjectCommand({ Bucket, Key, Body, ContentType });
  const result = await s3.send(cmd);
  console.log('✅ File uploaded to S3');
  return result;
};

const listObjects = async ({ Bucket, Prefix }) => {
  if (Bucket === 'local-bucket') {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    const files = getAllFiles(uploadDir);
    const filtered = files.filter(f => f.startsWith(path.join(uploadDir, Prefix || '').replace(/\\/g, '/')));
    return { Contents: filtered.map(Key => ({ Key: path.relative(uploadDir, Key).replace(/\\/g, '/') })) };
  }
  const cmd = new ListObjectsV2Command({ Bucket, Prefix });
  return s3.send(cmd);
};

const deleteObject = async ({ Bucket, Key }) => {
  if (Bucket === 'local-bucket') {
    try {
      const localPath = path.join(__dirname, '..', 'uploads', Key);
      await fs.unlink(localPath);
    } catch (e) {
      // Ignore if file doesn't exist
    }
    return;
  }
  const cmd = new DeleteObjectCommand({ Bucket, Key });
  return s3.send(cmd);
};

const signGetUrl = async ({ Bucket, Key, expiresIn = 3600 }) => {
  const cmd = new PutObjectCommand({ Bucket, Key });
  // Note: For GET, we'd normally use GetObjectCommand. Keeping PUT signer for future direct-upload if needed.
  // Implement GetObject presign correctly:
  const { GetObjectCommand } = require('@aws-sdk/client-s3');
  const getCmd = new GetObjectCommand({ Bucket, Key });
  return getSignedUrl(s3, getCmd, { expiresIn });
};

const { PutObjectCommand: PutCmd } = require('@aws-sdk/client-s3');

async function putJson({ Bucket, Key, json }) {
  console.log('putJson called with Bucket:', Bucket, 'Key:', Key);
  if (Bucket === 'local-bucket') {
    const localPath = path.join(__dirname, '..', 'uploads', Key);
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, JSON.stringify(json, null, 2));
    return;
  }
  const body = Buffer.from(JSON.stringify(json, null, 2));
  const cmd = new PutCmd({ Bucket, Key, Body: body, ContentType: 'application/json' });
  return s3.send(cmd);
}

async function getJson({ Bucket, Key }) {
  if (Bucket === 'local-bucket') {
    try {
      const localPath = path.join(__dirname, '..', 'uploads', Key);
      const data = await fs.readFile(localPath, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      throw new Error('NoSuchKey');
    }
  }
  const cmd = new GetObjectCommand({ Bucket, Key });
  const res = await s3.send(cmd);
  const buf = await streamToBuffer(res.Body);
  return JSON.parse(buf.toString('utf-8'));
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (d) => chunks.push(d));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

module.exports = { s3, bucket, putObject, listObjects, deleteObject, signGetUrl, putJson, getJson, getS3Url };
