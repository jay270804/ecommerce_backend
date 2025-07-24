const express = require("express");
const router = express.Router();
const { upload, uploadMultiple, getFileUrl, deleteFile } = require("../config/upload");
const { generateProductImages, createSrcSet } = require("../utils/imageProcessor");
const {
  validateObjectId,
  validateProduct,
  validatePagination,
} = require("../middleware/validation");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFilterMetadata,
  listS3Images,
  deleteS3Image
} = require("../controllers/productController");

// Public routes (product browsing) - No authentication required
router.get("/", validatePagination, getAllProducts);
router.get("/filters/metadata", getFilterMetadata);
router.get("/s3-images", authenticateToken, requireAdmin, listS3Images);
router.get("/:id", validateObjectId, getProductById);

// Admin-only routes
router.post(
  "/upload-image",
  authenticateToken,
  requireAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file provided",
        });
      }
      // Use the same logic as in createProduct for S3 upload
      const { processImageBuffer } = require("../utils/imageProcessor");
      const { uploadBufferToS3 } = require("../controllers/productController");
      // In-memory processing (compression)
      const processedBuffer = await processImageBuffer(req.file.buffer, { format: "jpeg", quality: 85 });
      const s3Url = await uploadBufferToS3(processedBuffer, "image/jpeg");
      res.json({
        success: true,
        message: "Image uploaded to S3 successfully",
        data: {
          url: s3Url,
          originalName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
        },
      });
    } catch (error) {
      console.error("Error uploading image to S3:", error);
      res.status(500).json({
        success: false,
        message: "Error uploading image to S3",
        error: error.message,
      });
    }
  }
);

// POST create new product (supports multiple image uploads)
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  uploadMultiple.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'images', maxCount: 9 } // Up to 9 additional images
  ]),
  validateProduct,
  createProduct
);

// PUT update product (supports multiple image uploads)
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  validateObjectId,
  uploadMultiple.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'images', maxCount: 9 } // Up to 9 additional images
  ]),
  updateProduct
);

// DELETE product
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  validateObjectId,
  deleteProduct
);

// Add this route for deleting an S3 image (admin only)
router.delete(
  '/s3-images/:key',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const key = decodeURIComponent(req.params.key);
    if (!key) {
      return res.status(400).json({ success: false, message: 'Image key required' });
    }
    const result = await deleteS3Image(key);
    if (result) {
      return res.json({ success: true, message: 'Image deleted from S3' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to delete image from S3' });
    }
  }
);

module.exports = router;
