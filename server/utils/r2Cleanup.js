const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { r2Client } = require('../config/r2');
const { URL } = require('url');

/**
 * Parses an image URL, extracts the R2 object key, and deletes it from Cloudflare R2.
 * Used to clean up orphaned assets if MongoDB save operations fail.
 * 
 * @param {string} url - The permanent public R2 URL of the uploaded image.
 */
const deleteR2ObjectByUrl = async (url) => {
  if (!url) return;
  try {
    const parsed = new URL(url);
    
    // Extract the public R2 domain from the configured environment
    const publicUrl = process.env.R2_PUBLIC_URL || 'https://pub-e6f260e5585e478f97539f033602e015.r2.dev';
    const r2Domain = new URL(publicUrl).hostname;
    
    // Check if the URL points to our R2 public domain
    if (parsed.hostname === r2Domain) {
      // Slice off the leading slash to get the object key (e.g. "categories/filename.webp")
      const key = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
      const bucketName = process.env.R2_BUCKET_NAME || 'twoshot-portfolio';
      
      console.log(`[CLEANUP] Deleting orphaned R2 object. Bucket: "${bucketName}", Key: "${key}"`);
      await r2Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      }));
      console.log(`[CLEANUP] Successfully deleted orphaned R2 object: "${key}"`);
    } else {
      console.log(`[CLEANUP] URL hostname "${parsed.hostname}" is not R2 domain "${r2Domain}". Skipping delete.`);
    }
  } catch (err) {
    console.error(`[CLEANUP ERROR] Failed to delete orphaned R2 object from URL: ${url}`, err.message);
  }
};

module.exports = {
  deleteR2ObjectByUrl,
};
