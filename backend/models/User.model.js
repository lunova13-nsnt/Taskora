const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  lastLogin: { type: Date },
  loginDates: [{ type: String }],
  streak: { type: Number, default: 0 },
  otp: { type: String },
  otpExpiry: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);