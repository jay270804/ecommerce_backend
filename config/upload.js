const multer = require('multer');

// Image validation configuration
const IMAGE_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  minDimensions: { width: 200, height: 200 },
  maxDimensions: { width: 4000, height: 4000 },
  aspectRatio: { min: 0.5, max: 2.0 }, // width/height ratio
  quality: 85 // for compression
};

// Check if file is image
const isImageFile = (mimetype) => {
  return IMAGE_CONFIG.allowedTypes.includes(mimetype);
};

// Enhanced file filter with validation
const fileFilter = (req, file, cb) => {
  if (!isImageFile(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, and WebP images are allowed!'), false);
  }
  cb(null, true);
};

// Use memory storage for multer
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: IMAGE_CONFIG.maxSize,
  },
  fileFilter: fileFilter
});

const uploadMultiple = multer({
  storage: storage,
  limits: {
    fileSize: IMAGE_CONFIG.maxSize,
    files: 10 // Maximum 10 images per product
  },
  fileFilter: fileFilter
});

module.exports = {
  upload,
  uploadMultiple,
  isImageFile,
  IMAGE_CONFIG
};