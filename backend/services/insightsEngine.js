

const Session = require('../models/Session');
const calculateStreak = (sessions) => {
  if (!sessions || sessions.length === 0) return 0;

  const sessionDates = new Set();
  for (const session of sessions) {
    
    const dateObj = new Date(session.endedAt || session.startedAt);
    const dateStr = dateObj.toISOString().split('T')[0]; 
    sessionDates.add(dateStr);
  }

  
  const today = new Date();
  let cursor = new Date(today.toISOString().split('T')[0]); 

  let streak = 0;

  const todayStr = cursor.toISOString().split('T')[0];
  if (!sessionDates.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (sessionDates.has(cursor.toISOString().split('T')[0])) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};


const checkBurnout = (recentSessions) => {
  
  let score = 0;
  const reasons = [];

  
  if (!recentSessions || recentSessions.length === 0) {
    return {
      riskLevel: 'low',
      score: 0,
      reasons: [],
      recommendation: 'No recent activity. Start a focus session when you\'re ready.',
    };
  }

  
  const totalMinutes = recentSessions.reduce(
    (sum, s) => sum + (s.actualDuration || 0),
    0
  );

  const totalBreaks = recentSessions.reduce(
    (sum, s) => sum + (s.breaksTaken || 0),
    0
  );

  
  const totalHours = totalMinutes / 60;

  
  if (totalMinutes > 240) {
    score += 3;
    reasons.push(`You've focused for ${Math.round(totalMinutes)} minutes today (over 4 hours)`);
  }

  
  if (totalMinutes > 360) {
    score += 2;
    reasons.push('That\'s over 6 hours — your brain needs serious recovery');
  }

  
  if (totalHours >= 1 && totalBreaks / totalHours < 0.5) {
    score += 2;
    reasons.push(
      `Only ${totalBreaks} break${totalBreaks === 1 ? '' : 's'} in ${totalHours.toFixed(1)} hours of focus`
    );
  }

  
  const sortedByRecent = [...recentSessions].sort(
    (a, b) => new Date(b.startedAt) - new Date(a.startedAt)
  );
  if (sortedByRecent[0].status === 'abandoned') {
    score += 2;
    reasons.push('Your most recent session was abandoned — possible sign of fatigue');
  }

  
  const hadLateNight = recentSessions.some((s) => {
    const startHour = new Date(s.startedAt).getHours();
    return startHour >= 23 || startHour < 5; // 11 PM – 5 AM
  });
  if (hadLateNight) {
    score += 2;
    reasons.push('You had a late-night session — sleep affects focus quality');
  }

  
  if (recentSessions.length >= 3) {
    const avgLength = totalMinutes / recentSessions.length;
    if (avgLength < 15) {
      score += 2;
      reasons.push(
        `${recentSessions.length} sessions averaging only ${Math.round(avgLength)} minutes each — your focus may be fragmented`
      );
    }
  }

  
  let riskLevel;
  let recommendation;

  if (score >= 6) {
    riskLevel = 'high';
    recommendation = 'Take a real break — at least 30 minutes away from screens. Your performance will improve, not decline.';
  } else if (score >= 3) {
    riskLevel = 'medium';
    recommendation = 'Consider a 15-minute break before your next session.';
  } else {
    riskLevel = 'low';
    recommendation = 'You\'re pacing well. Keep up the steady rhythm.';
  }

  return { riskLevel, score, reasons, recommendation };
};



const dayName = (mongoDow) => {
  const names = ['', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return names[mongoDow] || 'Unknown';
};


const buildWeeklyReport = (
  totals,
  dailyBreakdown,
  hourlyBreakdown,
  dayOfWeekBreakdown
) => {
  const totalFocusMinutes = totals?.totalFocusMinutes || 0;
  const totalSessions = totals?.totalSessions || 0;
  const completedSessions = totals?.completedSessions || 0;
  const abandonedSessions = totals?.abandonedSessions || 0;
  const totalBreaks = totals?.totalBreaks || 0;


  const abandonmentRate =
    totalSessions > 0 ? abandonedSessions / totalSessions : 0;

  const avgSessionLength =
    completedSessions > 0
      ? Math.round(totalFocusMinutes / completedSessions)
      : 0;

  let peakHour = null;
  if (hourlyBreakdown.length > 0) {
    const peak = hourlyBreakdown.reduce((max, curr) =>
      curr.totalMinutes > max.totalMinutes ? curr : max
    );
    peakHour = peak._id;
  }

  let peakDayOfWeek = null;
  if (dayOfWeekBreakdown.length > 0) {
    const peak = dayOfWeekBreakdown.reduce((max, curr) =>
      curr.totalMinutes > max.totalMinutes ? curr : max
    );
    peakDayOfWeek = dayName(peak._id);
  }

  const formattedDailyBreakdown = dailyBreakdown.map((d) => ({
    date: d._id,
    focusMinutes: d.focusMinutes,
    sessions: d.sessions,
  }));

  return {
    windowDays: 7,
    totalFocusMinutes,
    totalSessions,
    completedSessions,
    abandonedSessions,
    abandonmentRate: parseFloat(abandonmentRate.toFixed(2)),
    avgSessionLength,
    totalBreaks,
    peakHour,
    peakDayOfWeek,
    dailyBreakdown: formattedDailyBreakdown,
  };
};

const closeOverrunSessions = async (userId) => {
  const activeSessions = await Session.find({
    userId,
    status: 'active',
  });

  let closedCount = 0;

  for (const session of activeSessions) {
    const plannedEndTime = new Date(session.startedAt);
    plannedEndTime.setMinutes(plannedEndTime.getMinutes() + session.plannedDuration);

    if (plannedEndTime < new Date()) {
        if (session.isOnBreak) {
        const activeBreak = session.breaks.find(b => b.endedAt === null);
        if (activeBreak) {
    
            const breakMs = plannedEndTime - activeBreak.startedAt;
            const breakMin = Math.max(1, Math.round(breakMs / 60000));
            activeBreak.endedAt = plannedEndTime;
            activeBreak.actualDuration = breakMin;
            session.totalBreakMinutes += breakMin;
        }
        session.isOnBreak = false;
    }

    session.status = 'completed';
    session.endedAt = plannedEndTime;
  
    session.actualDuration = Math.max(0, session.plannedDuration - session.totalBreakMinutes);
    await session.save();
    closedCount++;
   }
  }

  return closedCount;
};

module.exports = {
  calculateStreak,
  checkBurnout,
  buildWeeklyReport,
  closeOverrunSessions,
};