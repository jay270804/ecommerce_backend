const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
const productsDir = path.join(uploadsDir, 'products');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}

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

// Validate image dimensions
const validateImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const aspectRatio = width / height;

      // Check minimum dimensions
      if (width < IMAGE_CONFIG.minDimensions.width || height < IMAGE_CONFIG.minDimensions.height) {
        reject(new Error(`Image dimensions too small. Minimum: ${IMAGE_CONFIG.minDimensions.width}x${IMAGE_CONFIG.minDimensions.height}`));
        return;
      }

      // Check maximum dimensions
      if (width > IMAGE_CONFIG.maxDimensions.width || height > IMAGE_CONFIG.maxDimensions.height) {
        reject(new Error(`Image dimensions too large. Maximum: ${IMAGE_CONFIG.maxDimensions.width}x${IMAGE_CONFIG.maxDimensions.height}`));
        return;
      }

      // Check aspect ratio
      if (aspectRatio < IMAGE_CONFIG.aspectRatio.min || aspectRatio > IMAGE_CONFIG.aspectRatio.max) {
        reject(new Error(`Aspect ratio not allowed. Must be between ${IMAGE_CONFIG.aspectRatio.min} and ${IMAGE_CONFIG.aspectRatio.max}`));
        return;
      }

      resolve({ width, height, aspectRatio });
    };

    img.onerror = () => {
      reject(new Error('Invalid image file'));
    };

    img.src = URL.createObjectURL(file);
  });
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    cb(null, fileName);
  }
});

// Enhanced file filter with validation
const fileFilter = (req, file, cb) => {
  // Check file type
  if (!isImageFile(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, and WebP images are allowed!'), false);
  }

  // Check file size
  if (file.size > IMAGE_CONFIG.maxSize) {
    return cb(new Error(`File size too large. Maximum: ${IMAGE_CONFIG.maxSize / (1024 * 1024)}MB`), false);
  }

  cb(null, true);
};

// Configure multer for single file
const upload = multer({
  storage: storage,
  limits: {
    fileSize: IMAGE_CONFIG.maxSize,
  },
  fileFilter: fileFilter
});

// Configure multer for multiple files
const uploadMultiple = multer({
  storage: storage,
  limits: {
    fileSize: IMAGE_CONFIG.maxSize,
    files: 10 // Maximum 10 images per product
  },
  fileFilter: fileFilter
});

// Function to get file URL
const getFileUrl = (filename) => {
  return `/uploads/products/${filename}`;
};

// Function to delete file
const deleteFile = (filename) => {
  const filePath = path.join(productsDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Function to extract filename from URL
const extractFilenameFromUrl = (url) => {
  if (!url) return null;
  return path.basename(url);
};

// TODO: Add image compression and resizing
// const compressAndResizeImage = async (filePath, options = {}) => {
//   // This will be implemented when sharp is added
//   // For now, return the original file path
//   return filePath;
// };

module.exports = {
  upload,
  uploadMultiple,
  getFileUrl,
  deleteFile,
  extractFilenameFromUrl,
  productsDir,
  isImageFile,
  IMAGE_CONFIG,
  validateImageDimensions
};