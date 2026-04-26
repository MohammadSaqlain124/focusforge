// routes/insightsRoutes.js
// Routes for the Intelligence Engine.

const express = require('express');
const router = express.Router();
const { getStreak, getBurnoutCheck, getWeeklyInsights, } = require('../controllers/insightsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/streak', getStreak);
router.get('/burnout-check', getBurnoutCheck);
router.get('/weekly', getWeeklyInsights);

module.exports = router;