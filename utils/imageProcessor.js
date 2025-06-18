const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Image processing configuration
const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150, quality: 80 },
  small: { width: 300, height: 300, quality: 85 },
  medium: { width: 600, height: 600, quality: 85 },
  large: { width: 1200, height: 1200, quality: 90 },
  original: { quality: 95 }
};

// Process and resize image
const processImage = async (inputPath, outputPath, options = {}) => {
  try {
    const {
      width,
      height,
      quality = 85,
      format = 'jpeg',
      fit = 'cover',
      position = 'center'
    } = options;

    let processor = sharp(inputPath);

    // Resize if dimensions provided
    if (width || height) {
      processor = processor.resize(width, height, {
        fit,
        position,
        withoutEnlargement: true
      });
    }

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

    // Save processed image
    await processor.toFile(outputPath);
    return outputPath;
  } catch (error) {
    console.error('Image processing error:', error);
    throw error;
  }
};

// Generate multiple sizes for a product image
const generateProductImages = async (originalPath, filename) => {
  try {
    const baseName = path.parse(filename).name;
    const extension = path.parse(filename).ext;
    const uploadsDir = path.dirname(originalPath);

    const processedImages = {};

    // Generate different sizes
    for (const [size, config] of Object.entries(IMAGE_SIZES)) {
      if (size === 'original') {
        // Process original with compression
        const originalProcessedPath = path.join(uploadsDir, `${baseName}_original${extension}`);
        await processImage(originalPath, originalProcessedPath, {
          quality: config.quality
        });
        processedImages.original = path.basename(originalProcessedPath);
      } else {
        // Generate resized versions
        const resizedPath = path.join(uploadsDir, `${baseName}_${size}${extension}`);
        await processImage(originalPath, resizedPath, {
          width: config.width,
          height: config.height,
          quality: config.quality
        });
        processedImages[size] = path.basename(resizedPath);
      }
    }

    // Delete original file after processing
    if (fs.existsSync(originalPath)) {
      fs.unlinkSync(originalPath);
    }

    return processedImages;
  } catch (error) {
    console.error('Error generating product images:', error);
    throw error;
  }
};

// Get image URL for specific size
const getImageUrl = (filename, size = 'original') => {
  if (!filename) return null;

  const baseName = path.parse(filename).name;
  const extension = path.parse(filename).ext;

  // Remove existing size suffix if present
  const cleanBaseName = baseName.replace(/_(thumbnail|small|medium|large|original)$/, '');

  if (size === 'original') {
    return `/uploads/products/${cleanBaseName}_original${extension}`;
  }

  return `/uploads/products/${cleanBaseName}_${size}${extension}`;
};

// Delete all image sizes for a product
const deleteProductImages = (filename) => {
  if (!filename) return;

  const uploadsDir = path.join(__dirname, '../uploads/products');
  const baseName = path.parse(filename).name;
  const extension = path.parse(filename).ext;

  // Remove existing size suffix if present
  const cleanBaseName = baseName.replace(/_(thumbnail|small|medium|large|original)$/, '');

  // Delete all size variants
  Object.keys(IMAGE_SIZES).forEach(size => {
    const imagePath = path.join(uploadsDir, `${cleanBaseName}_${size}${extension}`);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  });
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
  IMAGE_SIZES
};