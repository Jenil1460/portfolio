const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a category name'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    coverImage: {
      type: String,
      required: [true, 'Please provide a cover image URL'],
    },
    description: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Slugify helper
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-'); // Replace multiple - with single -
};

// Auto slugify before validation
categorySchema.pre('validate', function (next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = slugify(this.name);
  }
  next();
});

const MongooseCategory = mongoose.model('Category', categorySchema);
const MockCategory = require('../utils/mockModel')('categories', categorySchema);

class CategoryProxy {
  constructor(data) {
    const Target = process.env.USE_MOCK_DB === 'true' ? MockCategory : MongooseCategory;
    return new Target(data);
  }

  static getTarget() {
    return process.env.USE_MOCK_DB === 'true' ? MockCategory : MongooseCategory;
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

module.exports = CategoryProxy;
