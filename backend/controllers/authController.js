// controllers/authController.js
// Purpose: Handles register, login, and "get current user" logic.
// Controllers contain BUSINESS LOGIC. Routes just connect URLs to controllers.

const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (no token needed)
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    // Create user (password gets auto-hashed by pre-save hook)
    const user = await User.create({ name, email, password });

    // Send back user info + token (so frontend logs them in immediately)
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    console.error('🔴 REGISTER ERROR:', error); // full error object
    console.error('🔴 STACK:', error.stack);    // stack trace
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password',
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    // Check user exists AND password matches (using our custom method)
    // We check both at once to avoid leaking which one is wrong (security)
    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          preferences: user.preferences,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get current logged-in user info
// @route   GET /api/auth/me
// @access  Private (token required)
const getMe = async (req, res) => {
  // req.user was set by the protect middleware
  res.json({
    success: true,
    data: req.user,
  });
};

module.exports = { registerUser, loginUser, getMe };