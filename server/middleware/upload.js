const multer = require('multer');

// Setup memory storage since we upload files to R2 immediately
const storage = multer.memoryStorage();

// File check filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Only JPG, JPEG, PNG, and WEBP images are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 Megabytes limit
  },
  fileFilter: fileFilter,
});

module.exports = upload;
