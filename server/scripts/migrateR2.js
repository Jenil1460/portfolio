const fs = require('fs');
const path = require('path');
const { S3Client, HeadObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'twoshot-portfolio';
const PUBLIC_URL_BASE = (process.env.R2_PUBLIC_URL || 'https://pub-e6f260e5585e478f97539f033602e015.r2.dev').replace(/\/$/, '');

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Helper to guess mime type
function getMimeType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    default: return 'image/jpeg';
  }
}

// Helper to check if an object exists in R2
async function checkObjectExists(key) {
  try {
    await r2Client.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
    return true;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    // If it's a credentials error or access denied, throw it so we stop migration
    throw err;
  }
}

// Helper to upload a local file to R2
async function uploadLocalFileToR2(localPath, key) {
  if (!fs.existsSync(localPath)) {
    return false;
  }
  const fileBuffer = fs.readFileSync(localPath);
  const mimeType = getMimeType(localPath);
  await r2Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  }));
  console.log(`[UPLOAD] Uploaded local file "${path.basename(localPath)}" to R2 key "${key}"`);
  return true;
}

// Extract filename and determine R2 key and local path
async function processImageUrl(url, folder) {
  if (!url) return null;

  try {
    // Check if it's already a permanent public R2 URL on the correct domain
    const targetDomain = new URL(PUBLIC_URL_BASE).hostname;
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname === targetDomain) {
      console.log(`[SKIP] URL is already on the target R2 domain: ${url}`);
      return url;
    }

    // Extract original filename
    const filename = decodeURIComponent(parsedUrl.pathname.split('/').pop());
    if (!filename || filename === 'image') {
      return null;
    }

    // Determine target R2 key: folder/filename
    const key = `${folder}/${filename}`;
    const localPath = path.join(__dirname, '..', 'uploads', filename);

    console.log(`[PROCESS] Checking image "${filename}"...`);

    // 1. Check if already in R2
    let existsInR2 = await checkObjectExists(key);

    // 2. If not in R2, check if local file exists and upload it
    if (!existsInR2) {
      console.log(`[MIGRATE] Object "${key}" not found in R2. Checking local filesystem...`);
      const uploaded = await uploadLocalFileToR2(localPath, key);
      if (uploaded) {
        existsInR2 = true;
      } else {
        console.warn(`[WARNING] Local file not found at "${localPath}" and object "${key}" does not exist in R2 bucket.`);
      }
    }

    // 3. If it exists in R2 now, return the new permanent public URL
    if (existsInR2) {
      const newUrl = `${PUBLIC_URL_BASE}/${key}`;
      console.log(`[SUCCESS] Storing permanent R2 URL: ${newUrl}`);
      return newUrl;
    }
  } catch (err) {
    console.error(`[ERROR] Failed to process URL "${url}":`, err.message);
  }

  return null;
}

// Main migration runner
async function migrate() {
  const useMockDb = process.env.USE_MOCK_DB === 'true';

  const runLocalJsonMigration = async () => {
    console.log('\n--- RUNNING MIGRATION IN MOCK JSON DATABASE MODE ---\n');
    const dbPath = path.join(__dirname, '..', 'data', 'db.json');
    if (!fs.existsSync(dbPath)) {
      console.error(`Local JSON database not found at ${dbPath}`);
      return;
    }

    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    let updatedCount = 0;

    // 1. Migrate Categories
    if (data.categories) {
      console.log(`\nProcessing ${data.categories.length} Categories...`);
      for (const cat of data.categories) {
        const newUrl = await processImageUrl(cat.coverImage, 'categories');
        if (newUrl && newUrl !== cat.coverImage) {
          cat.coverImage = newUrl;
          updatedCount++;
        }
      }
    }

    // 2. Migrate Videos
    if (data.videos) {
      console.log(`\nProcessing ${data.videos.length} Videos...`);
      for (const vid of data.videos) {
        const newUrl = await processImageUrl(vid.thumbnail, 'videos');
        if (newUrl && newUrl !== vid.thumbnail) {
          vid.thumbnail = newUrl;
          updatedCount++;
        }
      }
    }

    // 3. Migrate Settings
    if (data.settings) {
      console.log(`\nProcessing Settings...`);
      for (const set of data.settings) {
        if (set.logoUrl) {
          const newUrl = await processImageUrl(set.logoUrl, 'logos');
          if (newUrl && newUrl !== set.logoUrl) {
            set.logoUrl = newUrl;
            updatedCount++;
          }
        }
        if (set.aboutTeam && Array.isArray(set.aboutTeam)) {
          for (const member of set.aboutTeam) {
            if (member.image) {
              const newUrl = await processImageUrl(member.image, 'logos');
              if (newUrl && newUrl !== member.image) {
                member.image = newUrl;
                updatedCount++;
              }
            }
          }
        }
      }
    }

    // Write back JSON database
    if (updatedCount > 0) {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`\n[COMPLETE] Successfully migrated ${updatedCount} local/old R2 image URLs in local JSON DB!`);
    } else {
      console.log('\n[COMPLETE] No records needed migration in local JSON DB.');
    }
  };

  if (useMockDb) {
    await runLocalJsonMigration();
  } else {
    console.log('\n--- RUNNING MIGRATION IN MONGO DB MODE ---\n');
    try {
      // Set strict connection timeouts so we fall back quickly if offline
      await mongoose.connect(process.env.MONGO_URI, {
        connectTimeoutMS: 2000,
        serverSelectionTimeoutMS: 2000,
      });
      console.log(`MongoDB Connected for migration`);

      const Category = require('../models/Category');
      const Video = require('../models/Video');
      const Settings = require('../models/Settings');

      let updatedCount = 0;

      // 1. Migrate Categories
      const categories = await Category.find({});
      console.log(`\nProcessing ${categories.length} Categories...`);
      for (const cat of categories) {
        const newUrl = await processImageUrl(cat.coverImage, 'categories');
        if (newUrl && newUrl !== cat.coverImage) {
          cat.coverImage = newUrl;
          await cat.save();
          updatedCount++;
        }
      }

      // 2. Migrate Videos
      const videos = await Video.find({});
      console.log(`\nProcessing ${videos.length} Videos...`);
      for (const vid of videos) {
        const newUrl = await processImageUrl(vid.thumbnail, 'videos');
        if (newUrl && newUrl !== vid.thumbnail) {
          vid.thumbnail = newUrl;
          await vid.save();
          updatedCount++;
        }
      }

      // 3. Migrate Settings
      const settings = await Settings.findOne({});
      if (settings) {
        console.log(`\nProcessing Settings...`);
        let settingsModified = false;
        if (settings.logoUrl) {
          const newUrl = await processImageUrl(settings.logoUrl, 'logos');
          if (newUrl && newUrl !== settings.logoUrl) {
            settings.logoUrl = newUrl;
            settingsModified = true;
            updatedCount++;
          }
        }
        if (settings.aboutTeam && Array.isArray(settings.aboutTeam)) {
          for (const member of settings.aboutTeam) {
            if (member.image) {
              const newUrl = await processImageUrl(member.image, 'logos');
              if (newUrl && newUrl !== member.image) {
                member.image = newUrl;
                settingsModified = true;
                updatedCount++;
              }
            }
          }
        }
        if (settingsModified) {
          await settings.save();
        }
      }

      console.log(`\n[COMPLETE] Successfully migrated ${updatedCount} local/old R2 image URLs in MongoDB Atlas!`);
      await mongoose.disconnect();
    } catch (dbErr) {
      console.warn(`\n[WARNING] Remote MongoDB Connection Failed: ${dbErr.message}`);
      console.warn('[WARNING] Falling back to local JSON database migration...\n');
      await runLocalJsonMigration();
    }
  }
}

migrate().catch(console.error);
