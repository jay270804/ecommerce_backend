const Product = require('../models/Product');
const Category = require('../models/Category');
const { successResponse, errorResponse, validationErrorResponse, notFoundResponse } = require('../utils/response');
const { processImageBuffer } = require('../utils/imageProcessor');
const { v4: uuidv4 } = require('uuid');
const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Configure the S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Helper to upload a buffer to S3 and return the public URL
const uploadBufferToS3 = async (buffer, mimetype, folder = 'products') => {
  const ext = mimetype.split('/')[1] || 'jpg';
  const key = `${folder}/${uuidv4()}.${ext}`;
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
  });
  await s3Client.send(command);
  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

const listS3Images = async (req, res) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Prefix: 'products/', // Only list files in the 'products' folder
    });

    const response = await s3Client.send(command);

    const images = (response.Contents || []).map(item => ({
      key: item.Key,
      url: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`,
      lastModified: item.LastModified,
      size: item.Size,
    }));

    return successResponse(res, images, 'Images fetched successfully');
  } catch (error) {
    console.error('Error fetching images from S3:', error);
    return errorResponse(res, 'Error fetching images', 500, error.message);
  }
};

// Helper to delete an object from S3 by key or URL
const deleteS3Image = async (imageUrlOrKey) => {
  try {
    let key = imageUrlOrKey;
    // If a full URL is provided, extract the key
    if (key.startsWith('http')) {
      const url = new URL(key);
      key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
    }
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting image from S3:', error);
    return false;
  }
};

// DB should be accessed only at this layer not on routes layer.
// Get all products with filtering and pagination
const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      categoryId,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    if (categoryId) filter.categoryId = categoryId;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with filtering, sorting, and pagination
    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Remove responsive image URL logic
    const productsWithImages = products.map(product => product.toObject());

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));
    return successResponse(res, {
      products: productsWithImages,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    }, 'Products fetched successfully');
  } catch (error) {
    console.error('Error fetching products:', error);
    return errorResponse(res, 'Error fetching products', 500, error.message);
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId', 'name');

    if (!product) {
      return notFoundResponse(res, 'Product not found');
    }

    // Remove responsive image URL logic
    const productObj = product.toObject();

    return successResponse(res, productObj, 'Product fetched successfully');
  } catch (error) {
    console.error('Error fetching product:', error);
    return errorResponse(res, 'Error fetching product', 500, error.message);
  }
};
// QUERY: I want to upload coverimage and other images all as file, currently only coverimage is sent as file, images are sent as array of strings. (I need a uniform solution through which I can upload images while creating product through admin panel client)
// Create new product
const createProduct = async (req, res) => {
  try {
    const { name, summary, description, stockUnit, price, discountPercentage, categoryId, tags } = req.body;

    let coverImage = '';
    let additionalImages = [];

    // Process cover image (file upload)
    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      const file = req.files.coverImage[0];
      // In-memory processing (compression)
      const processedBuffer = await processImageBuffer(file.buffer, { format: 'jpeg', quality: 85 });
      coverImage = await uploadBufferToS3(processedBuffer, 'image/jpeg');
    } else if (req.body.coverImage) {
      coverImage = req.body.coverImage;
    }

    // Process additional images (file upload)
    if (req.files && req.files.images && req.files.images.length > 0) {
      for (const file of req.files.images) {
        const processedBuffer = await processImageBuffer(file.buffer, { format: 'jpeg', quality: 85 });
        const imageUrl = await uploadBufferToS3(processedBuffer, 'image/jpeg');
        additionalImages.push(imageUrl);
      }
    } else if (req.body.images) {
      additionalImages = JSON.parse(req.body.images);
    }

    // Validate required fields
    if (!name || !description || !coverImage || !price || !categoryId) {
      return validationErrorResponse(res, ['Missing required fields: name, description, coverImage, price, categoryId']);
    }
    if (price <= 0) {
      return validationErrorResponse(res, ['Price must be greater than 0']);
    }
    if (discountPercentage && (discountPercentage < 0 || discountPercentage > 100)) {
      return validationErrorResponse(res, ['Discount percentage must be between 0 and 100']);
    }

    const product = new Product({
      name,
      summary,
      description,
      coverImage,
      images: additionalImages,
      stockUnit: stockUnit || 0,
      price,
      discountPercentage: discountPercentage || 0,
      categoryId,
      tags: tags ? JSON.parse(tags) : []
    });

    const savedProduct = await product.save();
    await Category.findByIdAndUpdate(categoryId, { $push: { products: savedProduct._id } });
    return successResponse(res, savedProduct, 'Product created successfully', 201);
  } catch (error) {
    console.error('Error creating product:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return validationErrorResponse(res, validationErrors);
    }
    return errorResponse(res, 'Error creating product', 500, error.message);
  }
};
// QUERY: In the postman collection you provided, the POST and PUT apis have formdata in body, then why you are destructuring using `req.body`? Also in PUT api, I want to update images using file not string (for reference see issue above `createProduct` function)
// Update product
const updateProduct = async (req, res) => {
  try {
    const { name, summary, description, stockUnit, price, discountPercentage, categoryId, tags, isActive } = req.body;
    const currentProduct = await Product.findById(req.params.id);
    if (!currentProduct) {
      return notFoundResponse(res, 'Product not found');
    }
    let coverImage = currentProduct.coverImage;
    let additionalImages = currentProduct.images;
    let oldCoverImage = currentProduct.coverImage;
    let oldImages = currentProduct.images;
    // Process cover image (file upload)
    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      const file = req.files.coverImage[0];
      const processedBuffer = await processImageBuffer(file.buffer, { format: 'jpeg', quality: 85 });
      coverImage = await uploadBufferToS3(processedBuffer, 'image/jpeg');
      // Delete old cover image if changed
      if (oldCoverImage && oldCoverImage !== coverImage) {
        await deleteS3Image(oldCoverImage);
      }
    } else if (req.body.coverImage && req.body.coverImage !== currentProduct.coverImage) {
      coverImage = req.body.coverImage;
      // Delete old cover image if changed
      if (oldCoverImage && oldCoverImage !== coverImage) {
        await deleteS3Image(oldCoverImage);
      }
    }
    // Process additional images (file upload)
    if (req.files && req.files.images && req.files.images.length > 0) {
      // Delete all old images if new ones are uploaded
      if (oldImages && oldImages.length > 0) {
        for (const img of oldImages) {
          await deleteS3Image(img);
        }
      }
      additionalImages = [];
      for (const file of req.files.images) {
        const processedBuffer = await processImageBuffer(file.buffer, { format: 'jpeg', quality: 85 });
        const imageUrl = await uploadBufferToS3(processedBuffer, 'image/jpeg');
        additionalImages.push(imageUrl);
      }
    } else if (req.body.images) {
      const newImages = JSON.parse(req.body.images);
      // Delete images that are no longer present
      if (oldImages && oldImages.length > 0) {
        for (const img of oldImages) {
          if (!newImages.includes(img)) {
            await deleteS3Image(img);
          }
        }
      }
      additionalImages = newImages;
    }
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        summary,
        description,
        coverImage,
        images: additionalImages,
        stockUnit,
        price,
        discountPercentage,
        categoryId,
        tags: tags ? JSON.parse(tags) : currentProduct.tags,
        isActive
      },
      { new: true, runValidators: true }
    ).populate('categoryId', 'name');
    return successResponse(res, updatedProduct, 'Product updated successfully');
  } catch (error) {
    console.error('Error updating product:', error);
    return errorResponse(res, 'Error updating product', 500, error.message);
  }
};

// Delete product (soft delete)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return notFoundResponse(res, 'Product not found');
    }
    // Delete cover image and additional images from S3
    if (product.coverImage) {
      await deleteS3Image(product.coverImage);
    }
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        await deleteS3Image(img);
      }
    }
    // Soft delete by setting isActive to false
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    return successResponse(res, null, 'Product deleted successfully');
  } catch (error) {
    console.error('Error deleting product:', error);
    return errorResponse(res, 'Error deleting product', 500, error.message);
  }
};

// Get filter metadata
const getFilterMetadata = async (req, res) => {
  try {
    const categories = await Product.distinct('categoryId');

    // Get price range
    const priceStats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);

    return successResponse(res, {
      categories: categories.sort(),
      priceRange: priceStats[0] || { minPrice: 0, maxPrice: 0 }
    }, 'Filter metadata fetched successfully');
  } catch (error) {
    console.error('Error fetching filter metadata:', error);
    return errorResponse(res, 'Error fetching filter metadata', 500, error.message);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFilterMetadata,
  listS3Images,
  deleteS3Image,
  uploadBufferToS3 // Export for use in routes
};