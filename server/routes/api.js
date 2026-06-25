const express = require('express');
const router = express.Router();

// Middlewares
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Controllers
const authController = require('../controllers/authController');
const categoryController = require('../controllers/categoryController');
const videoController = require('../controllers/videoController');
const settingsController = require('../controllers/settingsController');
const uploadController = require('../controllers/uploadController');

// Models (for stats)
const Category = require('../models/Category');
const Video = require('../models/Video');
const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { r2Client } = require('../config/r2');

// --- AUTH ROUTING ---
router.post('/auth/login', authController.login);
router.get('/auth/profile', protect, authController.getProfile);

// Dashboard Statistics Route
router.get('/auth/stats', protect, async (req, res) => {
  try {
    const totalCategories = await Category.countDocuments();
    const totalVideos = await Video.countDocuments();
    
    // Recent videos list
    const recentVideos = await Video.find()
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent categories list
    const recentCategories = await Category.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // Sum files in Cloudflare R2
    let storageUsed = 0;
    let fileCount = 0;
    try {
      const bucketName = process.env.R2_BUCKET_NAME || 'twoshot-portfolio';
      const response = await r2Client.send(new ListObjectsV2Command({ Bucket: bucketName }));
      if (response.Contents) {
        fileCount = response.Contents.length;
        storageUsed = response.Contents.reduce((sum, item) => sum + (item.Size || 0), 0);
      }
    } catch (r2Error) {
      console.warn('R2 Statistics fetch error:', r2Error.message);
      // We can fallback to 0 bytes if R2 bucket is empty or not configured yet
    }

    res.status(200).json({
      success: true,
      data: {
        totalCategories,
        totalVideos,
        fileCount,
        storageUsed, // size in bytes
        recentVideos,
        recentCategories,
      },
    });
  } catch (error) {
    console.error('Stats aggregation error:', error);
    res.status(500).json({ success: false, message: 'Server error generating dashboard statistics' });
  }
});

// --- CATEGORY ROUTING ---
router.get('/categories', categoryController.getCategories);
router.post('/categories', protect, categoryController.createCategory);
router.put('/categories/:id', protect, categoryController.updateCategory);
router.delete('/categories/:id', protect, categoryController.deleteCategory);

// --- VIDEO ROUTING ---
router.get('/videos', videoController.getVideos);
router.get('/videos/:id', videoController.getVideoById);
router.get('/videos/category/:categoryId', videoController.getVideosByCategory);
router.post('/videos', protect, videoController.createVideo);
router.put('/videos/:id', protect, videoController.updateVideo);
router.delete('/videos/:id', protect, videoController.deleteVideo);

// --- UPLOAD ROUTING ---
router.post('/upload/image', protect, upload.single('image'), uploadController.uploadImage);

// --- SETTINGS ROUTING ---
router.get('/settings', settingsController.getSettings);
router.put('/settings', protect, settingsController.updateSettings);

module.exports = router;
