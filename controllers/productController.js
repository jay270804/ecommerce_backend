const Product = require('../models/Product');
const { deleteFile, extractFilenameFromUrl, getFileUrl } = require('../config/upload');
const { generateProductImages, deleteProductImages, createSrcSet } = require('../utils/imageProcessor');
const { successResponse, errorResponse, validationErrorResponse, notFoundResponse } = require('../utils/response');
const Category = require('../models/Category');

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

    // Add responsive image URLs to products
    const productsWithImages = products.map(product => {
      const productObj = product.toObject();
      if (productObj.coverImage) {
        productObj.coverImageSizes = createSrcSet(productObj.coverImage);
      }
      if (productObj.images && productObj.images.length > 0) {
        productObj.imagesSizes = productObj.images.map(img => createSrcSet(img));
      }
      return productObj;
    });

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

    // Add responsive image URLs
    const productObj = product.toObject();
    if (productObj.coverImage) {
      productObj.coverImageSizes = createSrcSet(productObj.coverImage);
    }
    if (productObj.images && productObj.images.length > 0) {
      productObj.imagesSizes = productObj.images.map(img => createSrcSet(img));
    }

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

    // Handle multiple image uploads
    let coverImage = '';
    let additionalImages = [];

    // Process cover image
    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      try {
        const imageSizes = await generateProductImages(req.files.coverImage[0].path, req.files.coverImage[0].filename);
        coverImage = imageSizes.original;
      } catch (error) {
        console.error('Error processing cover image:', error);
        return errorResponse(res, 'Error processing cover image', 400);
      }
    } else if (req.body.coverImage) {
      // If image URL is provided in JSON body
      coverImage = req.body.coverImage;
    }

    // Process additional images
    if (req.files && req.files.images && req.files.images.length > 0) {
      try {
        for (const file of req.files.images) {
          const imageSizes = await generateProductImages(file.path, file.filename);
          additionalImages.push(imageSizes.original);
        }
      } catch (error) {
        console.error('Error processing additional images:', error);
        return errorResponse(res, 'Error processing additional images', 400);
      }
    } else if (req.body.images) {
      // If image URLs are provided in JSON body
      additionalImages = JSON.parse(req.body.images);
    }

    // Validate required fields
    if (!name || !description || !coverImage || !price || !categoryId) {
      return validationErrorResponse(res, ['Missing required fields: name, description, coverImage, price, categoryId']);
    }

    // Validate price
    if (price <= 0) {
      return validationErrorResponse(res, ['Price must be greater than 0']);
    }

    // Validate discount percentage
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

    // Push product _id to category's products array
    await Category.findByIdAndUpdate(categoryId, {
      $push: { products: savedProduct._id }
    });

    // Add responsive image URLs to response
    const productObj = savedProduct.toObject();
    if (productObj.coverImage) {
      productObj.coverImageSizes = createSrcSet(productObj.coverImage);
    }
    if (productObj.images && productObj.images.length > 0) {
      productObj.imagesSizes = productObj.images.map(img => createSrcSet(img));
    }

    return successResponse(res, productObj, 'Product created successfully', 201);
  } catch (error) {
    console.error('Error creating product:', error);

    // Handle validation errors
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

    // Handle multiple image uploads
    let coverImage = currentProduct.coverImage;
    let additionalImages = currentProduct.images;

    // Process cover image
    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      try {
        // Delete old cover image files
        if (currentProduct.coverImage) {
          deleteProductImages(currentProduct.coverImage);
        }

        const imageSizes = await generateProductImages(req.files.coverImage[0].path, req.files.coverImage[0].filename);
        coverImage = imageSizes.original;
      } catch (error) {
        console.error('Error processing new cover image:', error);
        return errorResponse(res, 'Error processing cover image', 400);
      }
    } else if (req.body.coverImage && req.body.coverImage !== currentProduct.coverImage) {
      // If new image URL is provided in JSON body
      deleteProductImages(currentProduct.coverImage);
      coverImage = req.body.coverImage;
    }

    // Process additional images
    if (req.files && req.files.images && req.files.images.length > 0) {
      try {
        // Delete old additional images
        if (currentProduct.images && currentProduct.images.length > 0) {
          currentProduct.images.forEach(img => deleteProductImages(img));
        }

        // Process new additional images
        additionalImages = [];
        for (const file of req.files.images) {
          const imageSizes = await generateProductImages(file.path, file.filename);
          additionalImages.push(imageSizes.original);
        }
      } catch (error) {
        console.error('Error processing additional images:', error);
        return errorResponse(res, 'Error processing additional images', 400);
      }
    } else if (req.body.images) {
      // If image URLs are provided in JSON body
      // Delete old additional images
      if (currentProduct.images && currentProduct.images.length > 0) {
        currentProduct.images.forEach(img => deleteProductImages(img));
      }
      additionalImages = JSON.parse(req.body.images);
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

    // Add responsive image URLs to response
    const productObj = updatedProduct.toObject();
    if (productObj.coverImage) {
      productObj.coverImageSizes = createSrcSet(productObj.coverImage);
    }
    if (productObj.images && productObj.images.length > 0) {
      productObj.imagesSizes = productObj.images.map(img => createSrcSet(img));
    }

    return successResponse(res, productObj, 'Product updated successfully');
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

    // Delete all image files
    if (product.coverImage) {
      deleteProductImages(product.coverImage);
    }

    // Delete additional images
    if (product.images && product.images.length > 0) {
      product.images.forEach(img => deleteProductImages(img));
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
  getFilterMetadata
};