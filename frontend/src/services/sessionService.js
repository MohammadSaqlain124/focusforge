// src/services/sessionService.js
// All session-related API calls live here.
// Components call these functions instead of using axios directly.

import api from './api';

// Get all sessions for the logged-in user
export const fetchSessions = async ({ status, limit = 20, page = 1 } = {}) => {
  const params = { limit, page };
  if (status) params.status = status;
  
  const res = await api.get('/sessions', { params });
  return res.data; // { success, data, pagination }
};

// Get the user's currently active session (if any)
// We use the existing /sessions endpoint with ?status=active
export const fetchActiveSession = async () => {
  const res = await api.get('/sessions', { params: { status: 'active', limit: 1 } });
  // Return the first active session, or null
  return res.data.data[0] || null;
};

// Start a new session
export const startSession = async ({ goal, plannedDuration, tags = [] }) => {
  const res = await api.post('/sessions/start', { goal, plannedDuration, tags });
  return res.data.data; // the new session document
};

// End an existing session
export const endSession = async (sessionId, status = 'completed') => {
  const res = await api.patch(`/sessions/${sessionId}/end`, { status });
  return res.data.data;
};

// Log a break during an active session
export const logBreak = async (sessionId) => {
  const res = await api.patch(`/sessions/${sessionId}/break`);
  return res.data.data;
};

// Start a timed break (pauses the session)
export const startBreak = async (sessionId, plannedDuration) => {
  const { data } = await api.post(`/sessions/${sessionId}/break/start`, {
    plannedDuration,
  });
  return data.data; // unwrap { success, data } → just the session
};

// End the current break (resumes the session)
export const endBreak = async (sessionId) => {
  const { data } = await api.patch(`/sessions/${sessionId}/break/end`);
  return data.data;
};