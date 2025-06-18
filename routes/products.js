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
} = require("../controllers/productController");

// Public routes (product browsing) - No authentication required
router.get("/", validatePagination, getAllProducts);
router.get("/:id", validateObjectId, getProductById);
router.get("/filters/metadata", getFilterMetadata);

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

      // Generate multiple image sizes
      const imageSizes = await generateProductImages(req.file.path, req.file.filename);

      // Create responsive image URLs
      const responsiveImages = createSrcSet(imageSizes.original);

      res.json({
        success: true,
        message: "Image uploaded and processed successfully",
        data: {
          original: imageSizes.original,
          thumbnail: imageSizes.thumbnail,
          small: imageSizes.small,
          medium: imageSizes.medium,
          large: imageSizes.large,
          urls: responsiveImages,
          originalName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
        },
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({
        success: false,
        message: "Error uploading image",
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

module.exports = router;
