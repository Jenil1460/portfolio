const Settings = require('../models/Settings');

// @desc    Get website settings (creates defaults if not found)
// @route   GET /api/settings
// @access  Public
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      console.log('No settings record found. Generating default settings...');
      settings = await Settings.create({});
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Fetch settings error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching website configuration settings' });
  }
};

// @desc    Update website settings
// @route   PUT /api/settings
// @access  Private
const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings(req.body);
    } else {
      // Update fields
      Object.assign(settings, req.body);
    }

    await settings.save();

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: 'Server error updating website configuration settings' });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
