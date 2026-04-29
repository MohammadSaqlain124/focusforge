const Session = require('../models/Session');
const { closeOverrunSessions } = require('../services/insightsEngine');


const startSession = async (req, res) => {
  try {
    const { goal, plannedDuration, tags } = req.body;


    await closeOverrunSessions(req.user._id);

    if (!goal || !plannedDuration) {
      return res.status(400).json({
        success: false,
        error: 'Goal and plannedDuration are required',
      });
    }

    const existingActive = await Session.findOne({
      userId: req.user._id,
      status: 'active',
    });

    if (existingActive) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active session. End it before starting a new one.',
        activeSessionId: existingActive._id,
      });
    }


    const session = await Session.create({
      userId: req.user._id,
      goal,
      plannedDuration,
      tags: tags || [],
    });


    res.status(201).json({ success: true, data: session });

  } catch (error) {
    console.error('startSession error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


const endSession = async (req, res) => {
  try {
    const { status } = req.body;


    if (!['completed', 'abandoned'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be "completed" or "abandoned"',
      });
    }


    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }


    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to end this session',
      });
    }


    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: `Session is already ${session.status}`,
      });
    }


    const endedAt = new Date();

    // === Edge case: user ended session while on a break ===
    // We must close that break first so its time gets counted in totalBreakMinutes.
    if (session.isOnBreak) {
    const activeBreak = session.breaks.find(b => b.endedAt === null);
    if (activeBreak) {
        const breakMs = endedAt - activeBreak.startedAt;
        const breakMin = Math.max(1, Math.round(breakMs / 60000));
        activeBreak.endedAt = endedAt;
        activeBreak.actualDuration = breakMin;
        session.totalBreakMinutes += breakMin;
    }
    session.isOnBreak = false;
    }

    // === Honest duration calculation ===
    // Wall-clock elapsed minus all break time = actual focus time.
    const wallClockMs = endedAt - session.startedAt;
    const wallClockMin = Math.round(wallClockMs / 60000);
    const actualDurationMin = Math.max(0, wallClockMin - session.totalBreakMinutes);

    session.endedAt = endedAt;
    session.actualDuration = actualDurationMin;
    session.status = status;
    await session.save();

    res.json({ success: true, data: session });

  } catch (error) {
    console.error('endSession error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


const logBreak = async (req, res) => {
  try {

    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to modify this session',
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Cannot log break on an ended session',
      });
    }

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



const startBreak = async (req, res) => {
  try {
    const { plannedDuration } = req.body;

    
    if (!plannedDuration) {
      res.status(400);
      throw new Error('plannedDuration is required (in minutes)');
    }

    if (typeof plannedDuration !== 'number' || plannedDuration < 1 || plannedDuration > 60) {
      res.status(400);
      throw new Error('plannedDuration must be a number between 1 and 60');
    }


    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!session) {
      res.status(404);
      throw new Error('Session not found');
    }

    if (session.status !== 'active') {
      res.status(400);
      throw new Error('Cannot start a break on a non-active session');
    }

    if (session.isOnBreak) {
      res.status(400);
      throw new Error('You are already on a break. Resume the session first.');
    }

  
    
    session.breaks.push({
    startedAt: new Date(),
    plannedDuration,
    });
    session.isOnBreak = true;
    session.breaksTaken = (session.breaksTaken || 0) + 1; // keep legacy counter in sync, defensive

    await session.save();

    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (err) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ success: false, message: err.message });
  }
};


const endBreak = async (req, res) => {
  try {
  
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!session) {
      res.status(404);
      throw new Error('Session not found');
    }

    if (session.status !== 'active') {
      res.status(400);
      throw new Error('Cannot end a break on a non-active session');
    }

    if (!session.isOnBreak) {
      res.status(400);
      throw new Error('You are not currently on a break');
    }

    const activeBreak = session.breaks.find(b => b.endedAt === null);

    if (!activeBreak) {
      
      res.status(500);
      throw new Error('Inconsistent state: isOnBreak is true but no active break found');
    }

    
    const now = new Date();
    const breakDurationMs = now - activeBreak.startedAt;
    const breakDurationMin = Math.max(1, Math.round(breakDurationMs / 60000));
   
    activeBreak.endedAt = now;
    activeBreak.actualDuration = breakDurationMin;
    session.totalBreakMinutes += breakDurationMin;
    session.isOnBreak = false;

    await session.save();

    res.json({
      success: true,
      data: session,
    });
  } catch (err) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ success: false, message: err.message });
  }
};

const getMySessions = async (req, res) => {
  try {

    await closeOverrunSessions(req.user._id);

    const { status, limit = 20, page = 1 } = req.query;
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);

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

    const filter = { userId: req.user._id };

    if (status) {
      if (!['active', 'completed', 'abandoned'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'status must be active, completed, or abandoned',
        });
      }
      filter.status = status;
    }

    const sessions = await Session.find(filter)
      .sort({ startedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);


    const total = await Session.countDocuments(filter);


    res.json({
      success: true,
      data: sessions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });

  } catch (error) {
    console.error('getMySessions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }


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


module.exports = {
  startSession,
  endSession,
  logBreak,
  startBreak,
  endBreak,
  getMySessions,
  getSessionById,
};