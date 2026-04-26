// middleware/authMiddleware.js
// Purpose: Protects routes. Verifies the JWT token sent by the client.
// If valid: attaches user info to req.user and calls next().
// If invalid: returns 401 Unauthorized.

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Frontend will send token as: "Authorization: Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract just the token part (after "Bearer ")
      token = req.headers.authorization.split(' ')[1];

      // Verify token signature using our secret
      // If tampered or expired, this throws an error
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user in DB (excluding password field for safety)
      // .select('-password') excludes password from the returned doc
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User no longer exists',
        });
      }

      // All good — pass control to the next middleware/route handler
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized, token failed',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized, no token provided',
    });
  }
};

module.exports = { protect };