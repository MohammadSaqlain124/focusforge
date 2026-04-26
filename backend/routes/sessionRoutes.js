
// Maps URLs and HTTP methods to session controller functions.

const express = require('express');
const router = express.Router();
const {
  startSession,
  endSession,
  logBreak,
  getMySessions,
  getSessionById,
} = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

// Apply 'protect' to every route in this file.
// Anything below this line requires a valid JWT.
router.use(protect);

router.post('/start', startSession);
router.patch('/:id/end', endSession);
router.patch('/:id/break', logBreak);
router.get('/', getMySessions);
router.get('/:id', getSessionById);

module.exports = router;