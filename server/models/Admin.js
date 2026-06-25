const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please fill a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'superadmin'],
      default: 'admin',
    },
  },
  { timestamps: true }
);

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const MongooseAdmin = mongoose.model('Admin', adminSchema);
const MockAdmin = require('../utils/mockModel')('admins', adminSchema);

class AdminProxy {
  constructor(data) {
    const Target = process.env.USE_MOCK_DB === 'true' ? MockAdmin : MongooseAdmin;
    return new Target(data);
  }

  static getTarget() {
    return process.env.USE_MOCK_DB === 'true' ? MockAdmin : MongooseAdmin;
  }

  static find(query) { return this.getTarget().find(query); }
  static findOne(query) { return this.getTarget().findOne(query); }
  static findById(id) { return this.getTarget().findById(id); }
  static create(data) { return this.getTarget().create(data); }
  static countDocuments(query) { return this.getTarget().countDocuments(query); }
  static findByIdAndUpdate(id, update, options) { return this.getTarget().findByIdAndUpdate(id, update, options); }
}

module.exports = AdminProxy;
