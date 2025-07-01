const Category = require('../models/Category');
const Brand = require('../models/Brand');

// Get all categories
const getAllCategories = async (req, res) => {
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
    const categories = await Category.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCategories = await Category.countDocuments(filter);
    const totalPages = Math.ceil(totalCategories / parseInt(limit));

    res.json({
      success: true,
      data: categories,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCategories,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// Get category by ID
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

// Create new category (Admin only)
const createCategory = async (req, res) => {
  try {
    const { name, description, brand } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const category = new Category({
      name,
      description,
      brand
    });

    const savedCategory = await category.save();

    // Push category _id to brand's categories array
    await Brand.findByIdAndUpdate(brand, {
      $push: { categories: savedCategory._id }
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: savedCategory
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};

// Update category (Admin only)
const updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if category name already exists (excluding current category)
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: req.params.id }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

// Delete category (Admin only)
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully',
      data: category
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};

// Get category statistics (Admin only)
const getCategoryStats = async (req, res) => {
  try {
    const totalCategories = await Category.countDocuments();

    // TODO: Categories with most products (would need Product model reference)
    // const categoriesWithProductCount = await Category.aggregate([
    //   {
    //     $lookup: {
    //       from: 'products',
    //       localField: '_id',
    //       foreignField: 'categoryId',
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
        totalCategories
        // categoriesWithProductCount
      }
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats
};