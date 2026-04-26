
// Pure business logic for calculating insights from session data.
// No req/res here — just functions that take data in and return analysis out.


const Session = require('../models/Session');
const calculateStreak = (sessions) => {
  // Edge case: no sessions = no streak
  if (!sessions || sessions.length === 0) return 0;

  // Step 1: Extract unique dates as YYYY-MM-DD strings
  // This collapses multiple sessions on the same day to a single date
  const sessionDates = new Set();
  for (const session of sessions) {
    // Use endedAt if available (when the session was actually completed),
    // otherwise fall back to startedAt
    const dateObj = new Date(session.endedAt || session.startedAt);
    const dateStr = dateObj.toISOString().split('T')[0]; // "2026-04-26"
    sessionDates.add(dateStr);
  }

  // Step 2: Get today's date as a YYYY-MM-DD string
  const today = new Date();
  let cursor = new Date(today.toISOString().split('T')[0]); // strips time

  // Step 3: Walk backward day-by-day, counting consecutive days
  let streak = 0;

  // Special case: if today has no session but yesterday does,
  // the streak might still be alive (just through yesterday).
  // We allow the streak to start from yesterday if today is empty.
  const todayStr = cursor.toISOString().split('T')[0];
  if (!sessionDates.has(todayStr)) {
    // Move cursor to yesterday
    cursor.setDate(cursor.getDate() - 1);
  }

  // Now count consecutive days going backward
  while (sessionDates.has(cursor.toISOString().split('T')[0])) {
    streak++;
    cursor.setDate(cursor.getDate() - 1); // move one day back
  }

  return streak;
};

/**
 * Analyze sessions from the last 24 hours and detect burnout risk.
 *
 * Rules:
 *  1. Total focus time today > 240 mins (4 hrs)  → +3 score
 *  2. Total focus time today > 360 mins (6 hrs)  → +2 more score
 *  3. Avg breaks per hour < 0.5 (under-resting)  → +2 score
 *  4. Last session was abandoned                  → +2 score
 *  5. Any session started after 11 PM             → +2 score (late-night flag)
 *  6. 3+ sessions in last 24h with avg < 15 mins  → +2 score (fragmented work)
 *
 * Score thresholds:
 *  0–2   → low risk
 *  3–5   → medium risk
 *  6+    → high risk
 *
 * @param {Array} recentSessions - sessions from the last 24 hours
 * @returns {Object} - { riskLevel, score, reasons, recommendation }
 */
const checkBurnout = (recentSessions) => {
  // Initialize the analysis
  let score = 0;
  const reasons = [];

  // Edge case: no sessions in last 24h = no risk
  if (!recentSessions || recentSessions.length === 0) {
    return {
      riskLevel: 'low',
      score: 0,
      reasons: [],
      recommendation: 'No recent activity. Start a focus session when you\'re ready.',
    };
  }

  // === Calculate aggregate metrics first ===
  // Total focus time = sum of actualDuration across all sessions
  const totalMinutes = recentSessions.reduce(
    (sum, s) => sum + (s.actualDuration || 0),
    0
  );

  // Total breaks across all sessions
  const totalBreaks = recentSessions.reduce(
    (sum, s) => sum + (s.breaksTaken || 0),
    0
  );

  // Hours of focus today (used for break-rate calculation)
  const totalHours = totalMinutes / 60;

  // === RULE 1: Heavy focus day ===
  if (totalMinutes > 240) {
    score += 3;
    reasons.push(`You've focused for ${Math.round(totalMinutes)} minutes today (over 4 hours)`);
  }

  // === RULE 2: EXTREME focus day (stacked on top of Rule 1) ===
  if (totalMinutes > 360) {
    score += 2;
    reasons.push('That\'s over 6 hours — your brain needs serious recovery');
  }

  // === RULE 3: Insufficient breaks ===
  // Healthy ratio: ~1 break per hour. Less than 0.5/hr is concerning.
  if (totalHours >= 1 && totalBreaks / totalHours < 0.5) {
    score += 2;
    reasons.push(
      `Only ${totalBreaks} break${totalBreaks === 1 ? '' : 's'} in ${totalHours.toFixed(1)} hours of focus`
    );
  }

  // === RULE 4: Last session was abandoned ===
  // Sort by startedAt descending and check the most recent
  const sortedByRecent = [...recentSessions].sort(
    (a, b) => new Date(b.startedAt) - new Date(a.startedAt)
  );
  if (sortedByRecent[0].status === 'abandoned') {
    score += 2;
    reasons.push('Your most recent session was abandoned — possible sign of fatigue');
  }

  // === RULE 5: Late-night session ===
  const hadLateNight = recentSessions.some((s) => {
    const startHour = new Date(s.startedAt).getHours();
    return startHour >= 23 || startHour < 5; // 11 PM – 5 AM
  });
  if (hadLateNight) {
    score += 2;
    reasons.push('You had a late-night session — sleep affects focus quality');
  }

  // === RULE 6: Fragmented work ===
  // Many short sessions = scattered attention
  if (recentSessions.length >= 3) {
    const avgLength = totalMinutes / recentSessions.length;
    if (avgLength < 15) {
      score += 2;
      reasons.push(
        `${recentSessions.length} sessions averaging only ${Math.round(avgLength)} minutes each — your focus may be fragmented`
      );
    }
  }

  // === Determine risk level from score ===
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

/**
 * Helper: Convert a numeric day-of-week (0–6) to a readable name.
 * MongoDB returns Sunday = 1, Saturday = 7 in $dayOfWeek.
 */
const dayName = (mongoDow) => {
  const names = ['', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return names[mongoDow] || 'Unknown';
};

/**
 * Build a comprehensive weekly summary from raw aggregation results.
 *
 * @param {Object} aggregates - results from MongoDB pipelines
 * @param {Array} dailyBreakdown - daily aggregation result
 * @param {Array} hourlyBreakdown - hourly aggregation result
 * @param {Array} dayOfWeekBreakdown - day-of-week aggregation result
 * @returns {Object} - the formatted weekly report
 */
const buildWeeklyReport = (
  totals,
  dailyBreakdown,
  hourlyBreakdown,
  dayOfWeekBreakdown
) => {
  // === Totals come from a $group stage that summed across the week ===
  const totalFocusMinutes = totals?.totalFocusMinutes || 0;
  const totalSessions = totals?.totalSessions || 0;
  const completedSessions = totals?.completedSessions || 0;
  const abandonedSessions = totals?.abandonedSessions || 0;
  const totalBreaks = totals?.totalBreaks || 0;

  // === Derived metrics ===
  const abandonmentRate =
    totalSessions > 0 ? abandonedSessions / totalSessions : 0;

  const avgSessionLength =
    completedSessions > 0
      ? Math.round(totalFocusMinutes / completedSessions)
      : 0;

  // === Find peak hour from hourly breakdown ===
  // Each entry: { _id: <hour 0-23>, totalMinutes: ... }
  let peakHour = null;
  if (hourlyBreakdown.length > 0) {
    const peak = hourlyBreakdown.reduce((max, curr) =>
      curr.totalMinutes > max.totalMinutes ? curr : max
    );
    peakHour = peak._id;
  }

  // === Find peak day of week from dayOfWeek breakdown ===
  let peakDayOfWeek = null;
  if (dayOfWeekBreakdown.length > 0) {
    const peak = dayOfWeekBreakdown.reduce((max, curr) =>
      curr.totalMinutes > max.totalMinutes ? curr : max
    );
    peakDayOfWeek = dayName(peak._id);
  }

  // === Format daily breakdown nicely ===
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
  // Step 1: Fetch all active sessions for this user
  const activeSessions = await Session.find({
    userId,
    status: 'active',
  });

  let closedCount = 0;

  // Step 2: For each active session, check if it has overrun
  for (const session of activeSessions) {
    // Compute when the session SHOULD have ended
    const plannedEndTime = new Date(session.startedAt);
    plannedEndTime.setMinutes(plannedEndTime.getMinutes() + session.plannedDuration);

    // If the planned end time is in the past → auto-close it
    if (plannedEndTime < new Date()) {
      session.status = 'completed';
      session.endedAt = plannedEndTime;
      session.actualDuration = session.plannedDuration; // they planned it, they did (at least) it
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