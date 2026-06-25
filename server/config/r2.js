const { S3Client, HeadBucketCommand, CreateBucketCommand } = require('@aws-sdk/client-s3');

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const ensureBucketExists = async () => {
  const bucketName = process.env.R2_BUCKET_NAME || 'twoshot-portfolio';
  try {
    await r2Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`R2 Bucket "${bucketName}" exists and is accessible.`);
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      console.log(`R2 Bucket "${bucketName}" not found. Creating it...`);
      try {
        await r2Client.send(new CreateBucketCommand({ Bucket: bucketName }));
        console.log(`Successfully created R2 Bucket "${bucketName}".`);
      } catch (createError) {
        console.error(`Failed to create R2 Bucket: ${createError.message}`);
      }
    } else {
      console.error(`Error validating R2 Bucket accessibility: ${error.message}`);
    }
  }
};

module.exports = { r2Client, ensureBucketExists };
