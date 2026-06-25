const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { r2Client } = require('../config/r2');

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

    // Generate unique name
    const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${cleanOriginalName}`;
    const bucketName = process.env.R2_BUCKET_NAME || 'twoshot-portfolio';

    const uploadParams = {
      Bucket: bucketName,
      Key: fileName,
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
      publicUrl = `${publicUrl}/${fileName}`;
    } else {
      // Fallback to S3 endpoint layout
      publicUrl = `${process.env.R2_ENDPOINT}/${bucketName}/${fileName}`;
    }

    res.status(200).json({
      success: true,
      url: publicUrl,
      fileName: fileName,
    });
  } catch (error) {
    console.warn(`[WARNING] Cloudflare R2 Upload Failed (${error.message}). Falling back to local storage.`);
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

      res.status(200).json({
        success: true,
        url: publicUrl,
        fileName: fileName,
        local: true,
      });
    } catch (localError) {
      console.error('Local upload fallback failed:', localError);
      res.status(500).json({ success: false, message: `Upload failed: ${error.message}` });
    }
  }
};

module.exports = {
  uploadImage,
};
