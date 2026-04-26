// routes/authRoutes.js
// Purpose: Maps HTTP methods + URLs to controller functions.

const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe); // protect runs first, then getMe

module.exports = router;