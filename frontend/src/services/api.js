// src/services/api.js
// Centralized axios instance. Every API call goes through this.

import axios from 'axios';

// Base URL of our backend.
// In production, you'd use an environment variable for this.
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// === REQUEST INTERCEPTOR ===
// This runs BEFORE every request leaves the frontend.
// We use it to automatically attach the JWT token if the user is logged in.
// Why interceptors: avoids repeating "headers: { Authorization: ... }" in every call.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// === RESPONSE INTERCEPTOR ===
// This runs AFTER every response comes back.
// If the backend returns 401 (token invalid/expired), we auto-logout.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale auth state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login (only if not already there, to avoid infinite loop)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;