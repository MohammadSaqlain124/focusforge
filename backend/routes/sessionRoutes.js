

const express = require('express');
const router = express.Router();
const {
  startSession,
  endSession,
  logBreak,
  startBreak,
  endBreak,
  getMySessions,
  getSessionById,
} = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/start', startSession);
router.patch('/:id/end', endSession);
router.patch('/:id/break', logBreak);
router.post('/:id/break/start', startBreak);
router.patch('/:id/break/end', endBreak);   
router.get('/', getMySessions);
router.get('/:id', getSessionById);

module.exports = router;