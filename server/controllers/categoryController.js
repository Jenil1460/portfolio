const Category = require('../models/Category');
const Video = require('../models/Video');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const query = {};
    
    // Public queries typically only want active categories
    if (req.query.active === 'true') {
      query.active = true;
    }

    const categories = await Category.find(query).sort({ order: 1, createdAt: -1 });

    // Compute video counts dynamically for both Mongoose and Mock DB modes
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Video.countDocuments({ category: cat._id });
        const catObj = cat.toObject ? cat.toObject() : { ...cat };
        return {
          ...catObj,
          videoCount: count,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: categoriesWithCount.length,
      data: categoriesWithCount,
    });
  } catch (error) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving categories list' });
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res) => {
  try {
    const { name, coverImage, description, order, active } = req.body;

    if (!name || !coverImage) {
      return res.status(400).json({ success: false, message: 'Please provide category name and cover image' });
    }

    // Check if category name already exists
    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists' });
    }

    const category = await Category.create({
      name,
      coverImage,
      description,
      order: order || 0,
      active: active !== undefined ? active : true,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Server error creating new category' });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = async (req, res) => {
  try {
    const { name, coverImage, description, order, active } = req.body;

    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check if name is being changed and if new name is already taken
    if (name && name !== category.name) {
      const nameTaken = await Category.findOne({ name });
      if (nameTaken) {
        return res.status(400).json({ success: false, message: 'Category name already exists' });
      }
    }

    // Update properties
    category.name = name || category.name;
    category.coverImage = coverImage || category.coverImage;
    category.description = description !== undefined ? description : category.description;
    category.order = order !== undefined ? order : category.order;
    category.active = active !== undefined ? active : category.active;

    await category.save();

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'Server error updating category details' });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check if any videos are using this category
    const videosCount = await Video.countDocuments({ category: req.params.id });
    if (videosCount > 0) {
      const { cascade } = req.query;
      if (cascade === 'true') {
        // Cascade delete all videos in this category
        if (process.env.USE_MOCK_DB === 'true') {
          const db = require('../utils/mockModel')('videos').find({ category: req.params.id });
          const videos = await db;
          for (let v of videos) {
            await v.deleteOne();
          }
        } else {
          await Video.deleteMany({ category: req.params.id });
        }
        console.log(`Cascade deleted ${videosCount} videos under category ${category.name}`);
      } else {
        // Block and request confirmation details
        return res.status(400).json({
          success: false,
          hasVideos: true,
          videosCount,
          message: `This category contains ${videosCount} videos. Delete all videos also?`,
        });
      }
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Server error removing category' });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
