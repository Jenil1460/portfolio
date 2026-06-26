const express = require('express');
const https = require('https');
const http = require('http');
const { URL } = require('url');
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

// --- DRIVE PROXY ROUTING ---
const fetchDriveStream = (targetUrl, rangeHeader) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(targetUrl);
    const requestOptions = {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': '*/*',
      },
    };

    if (rangeHeader) {
      requestOptions.headers.Range = rangeHeader;
    }

    const client = parsedUrl.protocol === 'https:' ? https : http;
    const request = client.request(parsedUrl, requestOptions, (response) => {
      resolve(response);
    });

    request.on('error', reject);
    request.end();
  });
};

const urlCache = new Map(); // Cache: fileId -> { finalUrl, expiresAt }

const getFinalDriveUrl = async (fileId) => {
  let tempUrl = `https://drive.google.com/uc?export=media&id=${fileId}`;
  let response;
  try {
    response = await fetchDriveStream(tempUrl, null);
  } catch (err) {
    console.error('Initial fetchDriveStream error:', err.message);
    return tempUrl;
  }

  // Check for virus scan warning page (usually returns 200 OK with HTML content-type)
  if (response.statusCode === 200 && response.headers['content-type']?.includes('text/html')) {
    const body = await new Promise((resolve) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
        if (data.length > 100000) {
          resolve(data);
        }
      });
      response.on('end', () => resolve(data));
      response.on('error', () => resolve(data));
    });
    response.destroy();

    const confirmMatch = body.match(/confirm=([^&"\s]+)/);
    if (confirmMatch && confirmMatch[1]) {
      const confirmToken = confirmMatch[1];
      tempUrl = `https://drive.google.com/uc?export=media&id=${fileId}&confirm=${confirmToken}`;
      try {
        response = await fetchDriveStream(tempUrl, null);
      } catch (err) {
        console.error('Fetch with confirm token error:', err.message);
        return tempUrl;
      }
    } else {
      tempUrl = `https://drive.google.com/uc?export=media&id=${fileId}&confirm=t`;
      try {
        response = await fetchDriveStream(tempUrl, null);
      } catch (err) {
        console.error('Fallback fetch with confirm=t error:', err.message);
        return tempUrl;
      }
    }
  }

  let lastUrl = tempUrl;
  try {
    for (let redirectCount = 0; redirectCount < 8; redirectCount += 1) {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
        tempUrl = response.headers.location;
        lastUrl = tempUrl;
        response.destroy();
        response = await fetchDriveStream(tempUrl, null);
      } else {
        response.destroy();
        break;
      }
    }
  } catch (err) {
    console.error('Redirect loop error:', err.message);
  }

  return lastUrl;
};

router.get('/drive/:fileId', async (req, res) => {
  let activeUpstreamResponse = null;

  // Clean up upstream connection when client closes/aborts the request
  req.on('close', () => {
    if (activeUpstreamResponse) {
      activeUpstreamResponse.destroy();
    }
  });

  try {
    const fileId = req.params.fileId;
    if (!fileId) {
      return res.status(400).json({ success: false, message: 'Missing Drive file ID' });
    }

    const cached = urlCache.get(fileId);
    let driveUrl;

    if (cached && cached.expiresAt > Date.now()) {
      driveUrl = cached.finalUrl;
    } else {
      driveUrl = await getFinalDriveUrl(fileId);
      urlCache.set(fileId, {
        finalUrl: driveUrl,
        expiresAt: Date.now() + 3 * 60 * 60 * 1000,
      });
    }

    // Request the final CDN stream with client range headers
    let response = await fetchDriveStream(driveUrl, req.headers.range);

    if (!response) {
      return res.status(502).json({ success: false, message: 'Unable to proxy Drive video' });
    }

    // If the cached URL failed (e.g. 403 or 410 Gone), try to re-resolve and retry once
    if (response && [403, 410].includes(response.statusCode) && cached) {
      console.log(`Cached URL for file ${fileId} failed with status ${response.statusCode}. Retrying with fresh URL...`);
      response.destroy();
      urlCache.delete(fileId);

      driveUrl = await getFinalDriveUrl(fileId);
      urlCache.set(fileId, {
        finalUrl: driveUrl,
        expiresAt: Date.now() + 3 * 60 * 60 * 1000,
      });

      response = await fetchDriveStream(driveUrl, req.headers.range);
      if (!response) {
        return res.status(502).json({ success: false, message: 'Unable to proxy Drive video' });
      }
    }

    activeUpstreamResponse = response;

    const statusCode = response.statusCode;
    const headersToCopy = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control',
      'etag',
      'last-modified',
    ];

    headersToCopy.forEach((name) => {
      if (response.headers[name]) {
        res.setHeader(name, response.headers[name]);
      }
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(statusCode);

    response.pipe(res);
  } catch (error) {
    console.error('Drive proxy error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Drive proxy failed' });
    }
  }
});

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
