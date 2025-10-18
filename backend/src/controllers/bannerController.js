const Banner = require('../models/Banner');
const cloudinary = require('../config/cloudinary');
const asyncHandler = require('express-async-handler');

// @desc    Get all banners
// @route   GET /api/v1/admin/banners
// @access  Admin
const getAllBanners = asyncHandler(async (req, res) => {
  try {
    const { position, type, isActive } = req.query;
    
    let filter = {};
    if (position) filter.position = position;
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const banners = await Banner.find(filter)
      .populate('createdBy', 'name email')
      .sort({ priority: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: banners.length,
      data: { banners }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching banners',
      error: error.message
    });
  }
});

// @desc    Get active banners for public display
// @route   GET /api/v1/banners/active
// @access  Public
const getActiveBanners = asyncHandler(async (req, res) => {
  try {
    const { position, page } = req.query;
    
    let filter = {
      isActive: true,
      $or: [
        { startDate: { $lte: new Date() } },
        { startDate: { $exists: false } }
      ],
      $and: [
        {
          $or: [
            { endDate: { $gte: new Date() } },
            { endDate: { $exists: false } }
          ]
        }
      ]
    };

    if (position) filter.position = position;
    if (page) filter.displayPages = { $in: [page, 'all'] };

    const banners = await Banner.find(filter)
      .sort({ priority: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: banners.length,
      data: { banners }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching active banners',
      error: error.message
    });
  }
});

// @desc    Get banner by ID
// @route   GET /api/v1/admin/banners/:id
// @access  Admin
const getBannerById = asyncHandler(async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { banner }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching banner',
      error: error.message
    });
  }
});

// @desc    Create new banner
// @route   POST /api/v1/admin/banners
// @access  Admin
const createBanner = asyncHandler(async (req, res) => {
  try {
    let bannerData = {
      ...req.body,
      createdBy: req.user._id
    };

    // Handle image upload if provided
    if (req.files && req.files.image) {
      const result = await cloudinary.uploader.upload(req.files.image.tempFilePath, {
        folder: 'banners',
        transformation: [
          { width: 1200, height: 400, crop: 'fill' },
          { quality: 'auto' }
        ]
      });

      bannerData.image = {
        public_id: result.public_id,
        url: result.secure_url
      };
    }

    // For announcement banners, set default content if not provided
    if (bannerData.type === 'top-bar' && (!bannerData.announcementItems || bannerData.announcementItems.length === 0)) {
      bannerData.announcementItems = [
        {
          icon: 'Mail',
          text: 'Get expert skincare advice: care@5elm.com'
        },
        {
          icon: 'Star',
          text: 'Ancient Ayurvedic Formulations - Modern Results'
        },
        {
          icon: 'Users',
          text: 'Join 50,000+ Happy Customers'
        },
        {
          icon: 'Truck',
          text: 'Free shipping on orders ₹1199+ across India'
        },
        {
          icon: 'Phone',
          text: '24/7 Customer Support: +91-11-4655-7000'
        }
      ];
    }

    const banner = await Banner.create(bannerData);

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: { banner }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating banner',
      error: error.message
    });
  }
});

// @desc    Update banner
// @route   PUT /api/v1/admin/banners/:id
// @access  Admin
const updateBanner = asyncHandler(async (req, res) => {
  try {
    let banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    let updateData = req.body;

    // Handle image upload if provided
    if (req.files && req.files.image) {
      // Delete old image from cloudinary
      if (banner.image && banner.image.public_id) {
        await cloudinary.uploader.destroy(banner.image.public_id);
      }

      const result = await cloudinary.uploader.upload(req.files.image.tempFilePath, {
        folder: 'banners',
        transformation: [
          { width: 1200, height: 400, crop: 'fill' },
          { quality: 'auto' }
        ]
      });

      updateData.image = {
        public_id: result.public_id,
        url: result.secure_url
      };
    }

    banner = await Banner.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      data: { banner }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating banner',
      error: error.message
    });
  }
});

// @desc    Delete banner
// @route   DELETE /api/v1/admin/banners/:id
// @access  Admin
const deleteBanner = asyncHandler(async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // Delete image from cloudinary
    if (banner.image && banner.image.public_id) {
      await cloudinary.uploader.destroy(banner.image.public_id);
    }

    await Banner.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error deleting banner',
      error: error.message
    });
  }
});

// @desc    Toggle banner status
// @route   PATCH /api/v1/admin/banners/:id/toggle
// @access  Admin
const toggleBannerStatus = asyncHandler(async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.status(200).json({
      success: true,
      message: `Banner ${banner.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { banner }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error toggling banner status',
      error: error.message
    });
  }
});

// @desc    Track banner click
// @route   POST /api/v1/banners/:id/click
// @access  Public
const trackBannerClick = asyncHandler(async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      { $inc: { clickCount: 1 } },
      { new: true }
    );

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Click tracked successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error tracking click',
      error: error.message
    });
  }
});

// @desc    Track banner impression
// @route   POST /api/v1/banners/:id/impression
// @access  Public
const trackBannerImpression = asyncHandler(async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      { $inc: { impressions: 1 } },
      { new: true }
    );

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Impression tracked successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error tracking impression',
      error: error.message
    });
  }
});

// @desc    Get top banner for announcement bar
// @route   GET /api/v1/banners/top-bar
// @access  Public
const getTopBarBanner = asyncHandler(async (req, res) => {
  try {
    const banner = await Banner.findOne({
      type: 'top-bar',
      position: 'top-bar',
      isActive: true,
      $or: [
        { startDate: { $lte: new Date() } },
        { startDate: { $exists: false } }
      ],
      $and: [
        {
          $or: [
            { endDate: { $gte: new Date() } },
            { endDate: { $exists: false } }
          ]
        }
      ]
    }).sort({ priority: -1, createdAt: -1 });

    if (!banner) {
      // Return default banner content
      return res.status(200).json({
        success: true,
        data: {
          banner: {
            _id: 'default',
            title: 'Default Announcement',
            backgroundColor: '#96583F',
            textColor: '#FFFFFF',
            animationType: 'scroll',
            announcementItems: [
              {
                icon: 'Mail',
                text: 'Get expert skincare advice: care@5elm.com'
              },
              {
                icon: 'Star',
                text: 'Ancient Ayurvedic Formulations - Modern Results'
              },
              {
                icon: 'Users',
                text: 'Join 50,000+ Happy Customers'
              },
              {
                icon: 'Truck',
                text: 'Free shipping on orders ₹1199+ across India'
              },
              {
                icon: 'Phone',
                text: '24/7 Customer Support: +91-11-4655-7000'
              }
            ]
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      data: { banner }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching top bar banner',
      error: error.message
    });
  }
});

module.exports = {
  getAllBanners,
  getActiveBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  trackBannerClick,
  trackBannerImpression,
  getTopBarBanner
};
