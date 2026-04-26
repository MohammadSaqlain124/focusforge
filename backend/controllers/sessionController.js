
// Business logic for managing focus sessions.

const Session = require('../models/Session');
const { closeOverrunSessions } = require('../services/insightsEngine');

// @desc    Start a new focus session
// @route   POST /api/sessions/start
// @access  Private (token required)
const startSession = async (req, res) => {
  try {
    const { goal, plannedDuration, tags } = req.body;

    // Auto-close any forgotten overrun sessions before starting a new one
    await closeOverrunSessions(req.user._id);

    // === Step 1: Validate input ===
    if (!goal || !plannedDuration) {
      return res.status(400).json({
        success: false,
        error: 'Goal and plannedDuration are required',
      });
    }

    // === Step 2: Business rule — only one active session per user ===
    // We query for any session this user has that's still active.
    // If found, reject the request — they must end the existing one first.
    const existingActive = await Session.findOne({
      userId: req.user._id,    // req.user is set by 'protect' middleware
      status: 'active',
    });

    if (existingActive) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active session. End it before starting a new one.',
        activeSessionId: existingActive._id, // helpful for frontend to redirect
      });
    }

    // === Step 3: Create the session ===
    // Mongoose validates against the schema BEFORE writing to DB.
    // If validation fails, the catch block handles it.
    const session = await Session.create({
      userId: req.user._id,
      goal,
      plannedDuration,
      tags: tags || [], // default to empty array if not provided
    });

    // === Step 4: Return the new session ===
    res.status(201).json({ success: true, data: session });

  } catch (error) {
    console.error('startSession error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    End an active session (mark as completed or abandoned)
// @route   PATCH /api/sessions/:id/end
// @access  Private
const endSession = async (req, res) => {
  try {
    const { status } = req.body;

    // === Step 1: Validate the new status ===
    // Only two valid end-states: 'completed' or 'abandoned'
    if (!['completed', 'abandoned'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be "completed" or "abandoned"',
      });
    }

    // === Step 2: Find the session ===
    // req.params.id comes from the URL: /api/sessions/THIS_ID/end
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    // === Step 3: AUTHORIZATION — does this session belong to the logged-in user? ===
    // ObjectIds aren't plain strings — convert both sides before comparing
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to end this session',
      });
    }

    // === Step 4: State check — only active sessions can be ended ===
    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: `Session is already ${session.status}`,
      });
    }

    // === Step 5: Calculate actual duration in minutes ===
    // Date subtraction returns milliseconds; divide by 60000 to get minutes
    const endedAt = new Date();
    const actualDurationMs = endedAt - session.startedAt;
    const actualDurationMin = Math.round(actualDurationMs / 60000);

    // === Step 6: Update and save ===
    session.endedAt = endedAt;
    session.actualDuration = actualDurationMin;
    session.status = status;
    await session.save();

    // === Step 7: Return updated session ===
    res.json({ success: true, data: session });

  } catch (error) {
    console.error('endSession error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Log a break taken during an active session
// @route   PATCH /api/sessions/:id/break
// @access  Private
const logBreak = async (req, res) => {
  try {
    // === Step 1: Find the session ===
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    // === Step 2: Authorization — owner only ===
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to modify this session',
      });
    }

    // === Step 3: State check — only active sessions allow breaks ===
    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Cannot log break on an ended session',
      });
    }

    // === Step 4: Atomic increment using $inc ===
    // findByIdAndUpdate with $inc is one atomic DB operation.
    // { new: true } tells Mongoose to return the UPDATED doc, not the old one.
    const updated = await Session.findByIdAndUpdate(
      req.params.id,
      { $inc: { breaksTaken: 1 } },
      { new: true }
    );

    res.json({ success: true, data: updated });

  } catch (error) {
    console.error('logBreak error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all sessions for the logged-in user (with filters + pagination)
// @route   GET /api/sessions
// @access  Private
const getMySessions = async (req, res) => {
  try {
    // Auto-close any overrun sessions so the list shows accurate state
    await closeOverrunSessions(req.user._id);

    // Query params let frontend ask for filtered/paginated data
    const { status, limit = 20, page = 1 } = req.query;
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);

    // === Step 2: Validate pagination params (don't trust user input) ===
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'limit must be a number between 1 and 100',
      });
    }
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        error: 'page must be a positive number',
      });
    }

    // === Step 3: Build the MongoDB filter ===
    // Always scope to the logged-in user — never show one user's sessions to another!
    const filter = { userId: req.user._id };

    // Optionally filter by status if provided
    if (status) {
      // Validate against the same enum from our schema
      if (!['active', 'completed', 'abandoned'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'status must be active, completed, or abandoned',
        });
      }
      filter.status = status;
    }

    // === Step 4: Query DB with sort + pagination ===
    // sort({ startedAt: -1 }) → newest first
    // skip + limit → pagination
    // The compound index we defined on the schema makes this fast
    const sessions = await Session.find(filter)
      .sort({ startedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // === Step 5: Get total count for pagination metadata ===
    // countDocuments runs a separate query but is cheap on indexed fields
    const total = await Session.countDocuments(filter);

    // === Step 6: Return data + pagination info ===
    res.json({
      success: true,
      data: sessions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum), // total number of pages available
      },
    });

  } catch (error) {
    console.error('getMySessions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get a single session by ID
// @route   GET /api/sessions/:id
// @access  Private
const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    // Authorization — owner only
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this session',
      });
    }

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('getSessionById error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { startSession, endSession, logBreak, getMySessions, getSessionById, };


