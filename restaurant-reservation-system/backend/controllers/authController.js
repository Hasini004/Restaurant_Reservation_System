const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// @route  POST /api/auth/register
// @access Public
// Note: allowing `role` on register is a deliberate simplification for
// this assignment (no email verification / invite flow exists). In a
// real product, admin accounts would be provisioned separately.
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role === 'admin' ? 'admin' : 'customer',
  });

  const token = signToken(user);
  res.status(201).json({ success: true, token, user: sanitizeUser(user) });
});

// @route  POST /api/auth/login
// @access Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signToken(user);
  res.status(200).json({ success: true, token, user: sanitizeUser(user) });
});

// @route  GET /api/auth/me
// @access Private
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: sanitizeUser(req.user) });
});

module.exports = { register, login, getMe };
