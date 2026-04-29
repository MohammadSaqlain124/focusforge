const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password',
      });
    }

    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    
    const user = await User.create({ name, email, password });

    
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
    console.error('REGISTER ERROR:', error); 
    console.error('STACK:', error.stack);    
    res.status(500).json({ success: false, error: error.message });
  }
};


const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password',
      });
    }

    
    const user = await User.findOne({ email });

    
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


const getMe = async (req, res) => {
  
  res.json({
    success: true,
    data: req.user,
  });
};

module.exports = { registerUser, loginUser, getMe };