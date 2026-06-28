const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { r2Client } = require('../config/r2');
const crypto = require('crypto');

// @desc    Upload image to Cloudflare R2
// @route   POST /api/upload/image
// @access  Private
const uploadImage = async (req, res) => {
  const file = req.file;
  try {
    if (!file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    
    // Check extension again just in case
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({ success: false, message: 'Unsupported file extension. Only jpg, jpeg, png, and webp are allowed.' });
    }

    // Determine folder from query parameter, defaulting to 'uploads'
    let folder = req.query.folder || req.body.folder || 'uploads';
    // Standardize folder (no leading/trailing slashes)
    folder = folder.replace(/^\/+|\/+$/g, '');

    // Generate unique name: folder/uuid-timestamp.extension
    const uuid = crypto.randomUUID();
    const timestamp = Date.now();
    const objectKey = `${folder}/${uuid}-${timestamp}.${fileExtension}`;
    const bucketName = process.env.R2_BUCKET_NAME || 'twoshot-portfolio';

    const uploadParams = {
      Bucket: bucketName,
      Key: objectKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    // Upload using AWS SDK S3 client
    await r2Client.send(new PutObjectCommand(uploadParams));

    // Construct URL
    let publicUrl = process.env.R2_PUBLIC_URL;
    if (publicUrl) {
      // Clean trailing slash
      publicUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
      publicUrl = `${publicUrl}/${objectKey}`;
    } else {
      // Fallback to S3 endpoint layout
      publicUrl = `${process.env.R2_ENDPOINT}/${bucketName}/${objectKey}`;
    }

    res.status(200).json({
      success: true,
      url: publicUrl,
      imageUrl: publicUrl,
      fileName: objectKey,
    });
  } catch (error) {
    console.error(`[ERROR] Cloudflare R2 Upload Failed: ${error.message}`);
    
    // Only fall back to local storage if running in local development mode
    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV || process.env.NODE_ENV === 'local';
    if (isDev) {
      console.warn(`[WARNING] Cloudflare R2 Upload Failed (${error.message}). Falling back to local storage for development.`);
      console.warn(`[WARNING] IMPORTANT: Because you are sharing a live MongoDB Atlas database, saving "localhost:5000" image URLs will result in broken images on your live production site! Please configure valid R2 credentials in server/.env.`);
      try {
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${cleanOriginalName}`;
        const localFilePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(localFilePath, file.buffer);

        const host = req.headers.host || 'localhost:5000';
        const protocol = req.secure ? 'https' : 'http';
        const publicUrl = `${protocol}://${host}/uploads/${fileName}`;

        return res.status(200).json({
          success: true,
          url: publicUrl,
          fileName: fileName,
          local: true,
        });
      } catch (localError) {
        console.error('Local upload fallback failed:', localError);
      }
    }

    res.status(500).json({
      success: false,
      message: `Cloudflare R2 upload failed: ${error.message}. Please verify your storage credentials in the administration environment.`,
    });
  }
};

module.exports = {
  uploadImage,
};
