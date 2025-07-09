const sharp = require('sharp');

const IMAGE_QUALITY = 85;

// Process and compress image in memory (buffer in, buffer out)
const processImageBuffer = async (inputBuffer, options = {}) => {
  try {
    const {
      quality = IMAGE_QUALITY,
      format = 'jpeg',
    } = options;

    let processor = sharp(inputBuffer);
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
    return await processor.toBuffer();
  } catch (error) {
    console.error('Image processing error:', error);
    throw error;
  }
};

module.exports = {
  processImageBuffer
};