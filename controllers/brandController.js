const Brand = require('../models/Brand');

// Get all brands
const getAllBrands = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    // Build filter object
    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const brands = await Brand.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalBrands = await Brand.countDocuments(filter);
    const totalPages = Math.ceil(totalBrands / parseInt(limit));

    res.json({
      success: true,
      data: brands,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalBrands,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching brands',
      error: error.message
    });
  }
};

// Get brand by ID
const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }

    res.json({
      success: true,
      data: brand
    });
  } catch (error) {
    console.error('Error fetching brand:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching brand',
      error: error.message
    });
  }
};

// Create new brand (Admin only)
const createBrand = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if brand already exists
    const existingBrand = await Brand.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingBrand) {
      return res.status(400).json({
        success: false,
        message: 'Brand with this name already exists'
      });
    }

    const brand = new Brand({
      name,
      description
    });

    const savedBrand = await brand.save();

    res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      data: savedBrand
    });
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating brand',
      error: error.message
    });
  }
};

// Update brand (Admin only)
const updateBrand = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if brand name already exists (excluding current brand)
    const existingBrand = await Brand.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: req.params.id }
    });

    if (existingBrand) {
      return res.status(400).json({
        success: false,
        message: 'Brand with this name already exists'
      });
    }

    const updatedBrand = await Brand.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true, runValidators: true }
    );

    if (!updatedBrand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }

    res.json({
      success: true,
      message: 'Brand updated successfully',
      data: updatedBrand
    });
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating brand',
      error: error.message
    });
  }
};

// Delete brand (Admin only)
const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }

    res.json({
      success: true,
      message: 'Brand deleted successfully',
      data: brand
    });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting brand',
      error: error.message
    });
  }
};

// Get brand statistics (Admin only)
const getBrandStats = async (req, res) => {
  try {
    const totalBrands = await Brand.countDocuments();

    // Brands with most products (would need Product model reference)
    // const brandsWithProductCount = await Brand.aggregate([
    //   {
    //     $lookup: {
    //       from: 'products',
    //       localField: '_id',
    //       foreignField: 'brandId',
    //       as: 'products'
    //     }
    //   },
    //   {
    //     $project: {
    //       name: 1,
    //       productCount: { $size: '$products' }
    //     }
    //   },
    //   {
    //     $sort: { productCount: -1 }
    //   }
    // ]);

    res.json({
      success: true,
      data: {
        totalBrands
        // brandsWithProductCount
      }
    });
  } catch (error) {
    console.error('Error fetching brand stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching brand statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  getBrandStats
};