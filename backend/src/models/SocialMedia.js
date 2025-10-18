const mongoose = require('mongoose');

const socialMediaSchema = new mongoose.Schema({
  platform: {
    type: String,
    enum: ['instagram', 'facebook', 'twitter', 'youtube', 'pinterest'],
    required: true
  },
  handle: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  followers: {
    count: { type: Number, default: 0 },
    displayText: { type: String, default: '0 Followers' }
  },
  engagement: {
    rate: { type: Number, default: 0 },
    displayText: { type: String, default: '0% Engagement' }
  },
  profileImage: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  posts: [{
    id: String,
    image: String,
    caption: String,
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    postDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
  }],
  settings: {
    showFollowerCount: { type: Boolean, default: true },
    showEngagementRate: { type: Boolean, default: true },
    showRecentPosts: { type: Boolean, default: true },
    postsToShow: { type: Number, default: 6 }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SocialMedia', socialMediaSchema);
