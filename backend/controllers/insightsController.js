// controllers/insightsController.js
// Thin HTTP handlers that delegate to the insights service.

const Session = require('../models/Session');
const mongoose = require('mongoose');
const {
  calculateStreak,
  checkBurnout,
  buildWeeklyReport,
} = require('../services/insightsEngine');

// @desc    Get the user's current focus streak (consecutive days with sessions)
// @route   GET /api/insights/streak
// @access  Private
const getStreak = async (req, res) => {
  try {
    // Fetch only completed sessions for this user
    // We don't count abandoned sessions toward streaks (that would be cheating)
    const sessions = await Session.find({
      userId: req.user._id,
      status: 'completed',
    }).select('startedAt endedAt'); // only fetch fields we need (perf optimization)

    // Delegate the actual calculation to the service layer
    const streak = calculateStreak(sessions);

    res.json({
      success: true,
      data: {
        streak,
        message:
          streak === 0
            ? 'No active streak. Complete a session today to start one!'
            : streak === 1
            ? 'Great start! Keep going to build momentum.'
            : `🔥 ${streak}-day streak! Keep it going.`,
      },
    });
  } catch (error) {
    console.error('getStreak error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Check the user's burnout risk based on recent sessions
// @route   GET /api/insights/burnout-check
// @access  Private
const getBurnoutCheck = async (req, res) => {
  try {
    // Window: last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Fetch sessions started in the last 24h, regardless of status
    // (we want abandoned ones too — that's a burnout signal)
    const recentSessions = await Session.find({
      userId: req.user._id,
      startedAt: { $gte: twentyFourHoursAgo },
    }).select('startedAt actualDuration breaksTaken status');

    // Delegate to service layer
    const analysis = checkBurnout(recentSessions);

    res.json({
      success: true,
      data: {
        ...analysis, // spread riskLevel, score, reasons, recommendation
        sessionsAnalyzed: recentSessions.length,
        windowHours: 24,
      },
    });
  } catch (error) {
    console.error('getBurnoutCheck error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get a weekly summary using MongoDB aggregation pipelines
// @route   GET /api/insights/weekly
// @access  Private
const getWeeklyInsights = async (req, res) => {
  try {
    // Window: last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // We need to convert userId to ObjectId for aggregation pipelines.
    // (find() converts automatically; aggregate() does NOT — you must do it.)
    const userObjectId = new mongoose.Types.ObjectId(req.user._id);

    // === Pipeline 1: Aggregate totals across the week ===
    // This collapses the entire week's sessions into a single summary doc.
    const totalsPipeline = await Session.aggregate([
      // Stage 1: filter
      {
        $match: {
          userId: userObjectId,
          startedAt: { $gte: sevenDaysAgo },
        },
      },
      // Stage 2: group EVERYTHING into one bucket (_id: null)
      // and compute sums/counts using accumulator operators
      {
        $group: {
          _id: null,
          totalFocusMinutes: { $sum: '$actualDuration' },
          totalSessions: { $sum: 1 },
          completedSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          abandonedSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'abandoned'] }, 1, 0] },
          },
          totalBreaks: { $sum: '$breaksTaken' },
        },
      },
    ]);
    // aggregate() returns an array; take first (and only) element, or null
    const totals = totalsPipeline[0] || null;

    // === Pipeline 2: Daily breakdown (group by date string) ===
    const dailyBreakdown = await Session.aggregate([
      {
        $match: {
          userId: userObjectId,
          status: 'completed',
          startedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$startedAt' },
          },
          focusMinutes: { $sum: '$actualDuration' },
          sessions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } }, // chronological
    ]);

    // === Pipeline 3: Hourly breakdown (find peak focus hour) ===
    const hourlyBreakdown = await Session.aggregate([
      {
        $match: {
          userId: userObjectId,
          status: 'completed',
          startedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $hour: '$startedAt' }, // 0–23
          totalMinutes: { $sum: '$actualDuration' },
        },
      },
    ]);

    // === Pipeline 4: Day-of-week breakdown ===
    const dayOfWeekBreakdown = await Session.aggregate([
      {
        $match: {
          userId: userObjectId,
          status: 'completed',
          startedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: '$startedAt' }, // 1=Sun, 7=Sat (Mongo convention)
          totalMinutes: { $sum: '$actualDuration' },
        },
      },
    ]);

    // === Build the final report by delegating to the service ===
    const report = buildWeeklyReport(
      totals,
      dailyBreakdown,
      hourlyBreakdown,
      dayOfWeekBreakdown
    );

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('getWeeklyInsights error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getStreak,
  getBurnoutCheck,
  getWeeklyInsights,
};