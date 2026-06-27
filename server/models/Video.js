const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a video title'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      required: [true, 'Please provide a video URL or Google Drive preview link'],
      trim: true,
    },
    thumbnail: {
      type: String,
      required: [true, 'Please upload or provide a thumbnail URL'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please assign a category to this video'],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    published: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    duration: {
      type: String,
      default: '00:00',
    },
    instagramLink: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

const MongooseVideo = mongoose.model('Video', videoSchema);
const MockVideo = require('../utils/mockModel')('videos', videoSchema);

class VideoProxy {
  constructor(data) {
    const Target = process.env.USE_MOCK_DB === 'true' ? MockVideo : MongooseVideo;
    return new Target(data);
  }

  static getTarget() {
    return process.env.USE_MOCK_DB === 'true' ? MockVideo : MongooseVideo;
  }

  static find(query) { return this.getTarget().find(query); }
  static findOne(query) { return this.getTarget().findOne(query); }
  static findById(id) { return this.getTarget().findById(id); }
  static create(data) { return this.getTarget().create(data); }
  static countDocuments(query) { return this.getTarget().countDocuments(query); }
  static findByIdAndUpdate(id, update, options) { return this.getTarget().findByIdAndUpdate(id, update, options); }
  static deleteMany(query) { return this.getTarget().deleteMany(query); }
  static deleteOne(query) { return this.getTarget().deleteOne(query); }
}

module.exports = VideoProxy;
