// src/services/insightsService.js
// API calls for the Intelligence Engine.

import api from './api';

export const fetchStreak = async () => {
  const res = await api.get('/insights/streak');
  return res.data.data; // { streak, message }
};

export const fetchBurnoutCheck = async () => {
  const res = await api.get('/insights/burnout-check');
  return res.data.data; // { riskLevel, score, reasons, recommendation, ... }
};

export const fetchWeeklyInsights = async () => {
  const res = await api.get('/insights/weekly');
  return res.data.data; // { totalFocusMinutes, peakHour, dailyBreakdown, ... }
};