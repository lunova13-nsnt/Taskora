const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('../models/User.model');
const { generateToken } = require('../config/jwt.config');
const { registerSchema, loginSchema } = require('../utils/validators');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const calculateStreak = (loginDates) => {
  if (!loginDates || loginDates.length === 0) return 1;
  const today = new Date().toISOString().split('T')[0];
  const sorted = [...new Set(loginDates)].sort().reverse();
  if (sorted[0] !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    if (sorted[0] !== yStr) return 1;
  }
  let streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = new Date(sorted[i]);
    const prev = new Date(sorted[i + 1]);
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
};

exports.register = async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ success: false, message: 'Email already registered.' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const today = new Date().toISOString().split('T')[0];
    const user = await User.create({
      name, email, password: hashedPassword, role,
      loginDates: [today], streak: 1, lastLogin: new Date()
    });
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, streak: user.streak },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

exports.login = async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ success: false, field: 'email', message: 'No account found with this email.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, field: 'password', message: 'Incorrect password. Please try again.' });

    const today = new Date().toISOString().split('T')[0];
    const loginDates = user.loginDates || [];
    if (!loginDates.includes(today)) loginDates.push(today);
    const streak = calculateStreak(loginDates);

    await User.findByIdAndUpdate(user._id, {
      loginDates, streak, lastLogin: new Date()
    });

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, streak },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp -otpExpiry');
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch user.' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: 'No account found with this email address.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await User.findByIdAndUpdate(user._id, { otp, otpExpiry });

    await transporter.sendMail({
      from: `"Taskora ⚡" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Your Taskora OTP Code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0d1117;color:#e2e8f0;border-radius:16px;padding:32px;border:1px solid rgba(0,255,200,0.2)">
          <h1 style="background:linear-gradient(135deg,#00ffc8,#7b61ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:28px;margin:0 0 8px">⚡ Taskora</h1>
          <p style="color:#64748b;margin:0 0 24px">Password Reset Request</p>
          <p style="color:#94a3b8;margin:0 0 16px">Your one-time password is:</p>
          <div style="background:rgba(0,255,200,0.08);border:1px solid rgba(0,255,200,0.25);border-radius:12px;padding:24px;text-align:center;margin:0 0 24px">
            <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#00ffc8">${otp}</span>
          </div>
          <p style="color:#64748b;font-size:13px">This OTP expires in <strong style="color:#ffa500">10 minutes</strong>. Do not share it with anyone.</p>
          <p style="color:#334155;font-size:12px;margin-top:24px">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `
    });

    res.status(200).json({ success: true, message: 'OTP sent to your email address.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to send OTP. Try again.' });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required.' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (!user.otp || user.otp !== otp)
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });

    if (new Date() > user.otpExpiry)
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });

    res.status(200).json({ success: true, message: 'OTP verified successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword)
    return res.status(400).json({ success: false, message: 'All fields are required.' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (!user.otp || user.otp !== otp)
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });

    if (new Date() > user.otpExpiry)
      return res.status(400).json({ success: false, message: 'OTP expired.' });

    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      otp: null,
      otpExpiry: null
    });

    res.status(200).json({ success: true, message: 'Password reset successfully! Please login.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};