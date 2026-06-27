const Video = require('../models/Video');
const Category = require('../models/Category');

// @desc    Get all videos
// @route   GET /api/videos
// @access  Public
const getVideos = async (req, res) => {
  try {
    const { category, search, featured, published, page, limit } = req.query;
    const query = {};

    // Filter by category if supplied (can be slug or id)
    if (category) {
      // Check if category is a valid ObjectId, otherwise treat as slug
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const foundCategory = await Category.findOne({ slug: category });
        if (foundCategory) {
          query.category = foundCategory._id;
        } else {
          // If category slug not found, return empty results
          return res.status(200).json({ success: true, count: 0, total: 0, data: [] });
        }
      }
    }

    // Search query matching title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by featured
    if (featured === 'true') {
      query.featured = true;
    }

    // Filter by published (default true for non-admin client queries)
    if (published === 'true') {
      query.published = true;
    } else if (published === 'false') {
      query.published = false;
    } else if (!req.headers.authorization) {
      // If no admin token, default to published only
      query.published = true;
    }

    // Pagination setup
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skipNum = (pageNum - 1) * limitNum;

    // Execute query
    const total = await Video.countDocuments(query);
    const videos = await Video.find(query)
      .populate('category', 'name slug')
      .sort({ featured: -1, createdAt: -1 }) // Featured videos float to top, then newest first
      .skip(skipNum)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: videos.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: videos,
    });
  } catch (error) {
    console.error('Fetch videos error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving videos list' });
  }
};

// @desc    Get video by ID & increment views
// @route   GET /api/videos/:id
// @access  Public
const getVideoById = async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('category', 'name slug');

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    // Get related videos (in the same category, excluding the current one)
    let relatedVideos = [];
    if (video.category && video.category._id) {
      relatedVideos = await Video.find({
        category: video.category._id,
        _id: { $ne: video._id },
        published: true,
      })
        .limit(4)
        .sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      data: video,
      related: relatedVideos,
    });
  } catch (error) {
    console.error('Fetch video details error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving video detail' });
  }
};

// @desc    Get videos by Category ID
// @route   GET /api/videos/category/:categoryId
// @access  Public
const getVideosByCategory = async (req, res) => {
  try {
    const query = { category: req.params.categoryId };

    // Only published videos for general public
    if (!req.headers.authorization) {
      query.published = true;
    }

    const videos = await Video.find(query)
      .populate('category', 'name slug')
      .sort({ featured: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: videos.length,
      data: videos,
    });
  } catch (error) {
    console.error('Fetch videos by category error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving videos for this category' });
  }
};

// @desc    Create a video
// @route   POST /api/videos
// @access  Private
const createVideo = async (req, res) => {
  try {
    const { title, description, videoUrl, thumbnail, category, featured, published, duration } = req.body;

    if (!title || !videoUrl || !thumbnail || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, videoUrl, thumbnail image, and category mapping',
      });
    }

    // Validate category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ success: false, message: 'Target category not found' });
    }

    const video = await Video.create({
      title,
      description,
      videoUrl,
      thumbnail,
      category,
      featured: featured || false,
      published: published !== undefined ? published : true,
      duration: duration || '00:00',
    });

    const populatedVideo = await video.populate('category', 'name slug');

    res.status(201).json({
      success: true,
      data: populatedVideo,
    });
  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({ success: false, message: 'Server error creating new video entry' });
  }
};

// @desc    Update a video
// @route   PUT /api/videos/:id
// @access  Private
const updateVideo = async (req, res) => {
  try {
    const { title, description, videoUrl, thumbnail, category, featured, published, duration } = req.body;

    let video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(404).json({ success: false, message: 'Target category not found' });
      }
      video.category = category;
    }

    video.title = title || video.title;
    video.description = description !== undefined ? description : video.description;
    video.videoUrl = videoUrl || video.videoUrl;
    video.thumbnail = thumbnail || video.thumbnail;
    video.featured = featured !== undefined ? featured : video.featured;
    video.published = published !== undefined ? published : video.published;
    video.duration = duration || video.duration;

    await video.save();

    const populatedVideo = await video.populate('category', 'name slug');

    res.status(200).json({
      success: true,
      data: populatedVideo,
    });
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ success: false, message: 'Server error updating video details' });
  }
};

// @desc    Delete a video
// @route   DELETE /api/videos/:id
// @access  Private
const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    await video.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting video entry' });
  }
};

module.exports = {
  getVideos,
  getVideoById,
  getVideosByCategory,
  createVideo,
  updateVideo,
  deleteVideo,
};
