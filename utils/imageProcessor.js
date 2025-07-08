const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Only one image config for 'original', compressed
const IMAGE_QUALITY = 85;

// Process and compress image
const processImage = async (inputPath, outputPath, options = {}) => {
  try {
    const {
      quality = IMAGE_QUALITY,
      format = 'jpeg',
    } = options;

    let processor = sharp(inputPath);
    // Convert to specified format and set quality
    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        processor = processor.jpeg({ quality });
        break;
      case 'png':
        processor = processor.png({ quality });
        break;
      case 'webp':
        processor = processor.webp({ quality });
        break;
      default:
        processor = processor.jpeg({ quality });
    }
    await processor.toFile(outputPath);
    return outputPath;
  } catch (error) {
    console.error('Image processing error:', error);
    throw error;
  }
};

// Generate only a compressed original image for a product
const generateProductImages = async (originalPath, filename) => {
  try {
    const baseName = path.parse(filename).name;
    const extension = path.parse(filename).ext;
    const uploadsDir = path.dirname(originalPath);
    const processedImages = {};
    // Only process and save the compressed original
    const originalProcessedPath = path.join(uploadsDir, `${baseName}_original${extension}`);
    await processImage(originalPath, originalProcessedPath, { quality: IMAGE_QUALITY });
    processedImages.original = path.basename(originalProcessedPath);
    // Delete original file after processing
    if (fs.existsSync(originalPath)) {
      fs.unlinkSync(originalPath);
    }
    return processedImages;
  } catch (error) {
    console.error('Error generating product image:', error);
    throw error;
  }
};

// Get image URL for the original size
const getImageUrl = (filename) => {
  if (!filename) return null;
  const baseName = path.parse(filename).name;
  const extension = path.parse(filename).ext;
  const cleanBaseName = baseName.replace(/_(thumbnail|small|medium|large|original)$/, '');
  return `/uploads/products/${cleanBaseName}_original${extension}`;
};

// Delete only the original image for a product
const deleteProductImages = (filename) => {
  if (!filename) return;
  const uploadsDir = path.join(__dirname, '../uploads/products');
  const baseName = path.parse(filename).name;
  const extension = path.parse(filename).ext;
  const cleanBaseName = baseName.replace(/_(thumbnail|small|medium|large|original)$/, '');
  const imagePath = path.join(uploadsDir, `${cleanBaseName}_original${extension}`);
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }
};

// Validate image metadata
const validateImageMetadata = async (filePath) => {
  try {
    const metadata = await sharp(filePath).metadata();

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      hasAlpha: metadata.hasAlpha,
      isOpaque: metadata.isOpaque
    };
  } catch (error) {
    console.error('Error reading image metadata:', error);
    throw error;
  }
};

// Optimize image for web
const optimizeForWeb = async (inputPath, outputPath, options = {}) => {
  try {
    const {
      quality = 85,
      format = 'webp',
      progressive = true,
      stripMetadata = true
    } = options;

    let processor = sharp(inputPath);

    // Strip metadata for smaller file size
    if (stripMetadata) {
      processor = processor.withMetadata(false);
    }

    // Convert to web-optimized format
    switch (format.toLowerCase()) {
      case 'webp':
        processor = processor.webp({
          quality,
          effort: 6 // Higher effort for better compression
        });
        break;
      case 'jpeg':
        processor = processor.jpeg({
          quality,
          progressive,
          mozjpeg: true // Better compression
        });
        break;
      case 'png':
        processor = processor.png({
          quality,
          progressive,
          compressionLevel: 9
        });
        break;
    }

    await processor.toFile(outputPath);
    return outputPath;
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw error;
  }
};

// Create responsive image srcset
const createSrcSet = (filename) => {
  if (!filename) return null;

  const baseName = path.parse(filename).name;
  const extension = path.parse(filename).ext;
  const cleanBaseName = baseName.replace(/_(thumbnail|small|medium|large|original)$/, '');

  return {
    thumbnail: getImageUrl(filename, 'thumbnail'),
    small: getImageUrl(filename, 'small'),
    medium: getImageUrl(filename, 'medium'),
    large: getImageUrl(filename, 'large'),
    original: getImageUrl(filename, 'original'),
    srcset: [
      `${getImageUrl(filename, 'thumbnail')} 150w`,
      `${getImageUrl(filename, 'small')} 300w`,
      `${getImageUrl(filename, 'medium')} 600w`,
      `${getImageUrl(filename, 'large')} 1200w`,
      `${getImageUrl(filename, 'original')} 2000w`
    ].join(', ')
  };
};

module.exports = {
  processImage,
  generateProductImages,
  getImageUrl,
  deleteProductImages,
  validateImageMetadata,
  optimizeForWeb,
  createSrcSet,
};