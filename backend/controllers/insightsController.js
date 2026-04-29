

const Session = require('../models/Session');
const mongoose = require('mongoose');
const {
  calculateStreak,
  checkBurnout,
  buildWeeklyReport,
  closeOverrunSessions,
} = require('../services/insightsEngine');


const getStreak = async (req, res) => {
  try {
    
    await closeOverrunSessions(req.user._id);

    
    const sessions = await Session.find({
      userId: req.user._id,
      status: 'completed',
    }).select('startedAt endedAt'); 

    
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


const getBurnoutCheck = async (req, res) => {
  try {
    await closeOverrunSessions(req.user._id);

    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    
    const recentSessions = await Session.find({
      userId: req.user._id,
      startedAt: { $gte: twentyFourHoursAgo },
    }).select('startedAt actualDuration breaksTaken status');

    
    const analysis = checkBurnout(recentSessions);

    res.json({
      success: true,
      data: {
        ...analysis, 
        sessionsAnalyzed: recentSessions.length,
        windowHours: 24,
      },
    });
  } catch (error) {
    console.error('getBurnoutCheck error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


const getWeeklyInsights = async (req, res) => {
  try {
    await closeOverrunSessions(req.user._id);

    
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    
    const userObjectId = new mongoose.Types.ObjectId(req.user._id);

    
    const totalsPipeline = await Session.aggregate([
      {
        $match: {
          userId: userObjectId,
          startedAt: { $gte: sevenDaysAgo },
        },
      },
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
    const totals = totalsPipeline[0] || null;

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
          _id: { $dayOfWeek: '$startedAt' }, 
          totalMinutes: { $sum: '$actualDuration' },
        },
      },
    ]);

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