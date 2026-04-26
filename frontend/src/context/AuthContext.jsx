// src/context/AuthContext.jsx
// Provides authentication state and actions to the entire app.

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

// 1. Create the context (a "channel" components can subscribe to)
const AuthContext = createContext(null);

// 2. Provider component — wraps the app and supplies the value
export function AuthProvider({ children }) {
  // user state: null when logged out, user object when logged in
  const [user, setUser] = useState(null);
  // loading state — true while we check localStorage on app boot
  const [loading, setLoading] = useState(true);

  // === On app boot, check if there's a saved user ===
  // This makes the login persist across page refreshes.
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        // If parsing fails, the data is corrupt — clear it
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  // === Login action ===
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const userData = res.data.data;

    // Persist token and user info
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  };

  // === Register action ===
  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    const userData = res.data.data;

    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  };

  // === Logout action ===
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // The value supplied to all consumers
  const value = { user, loading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 3. Custom hook — components use `useAuth()` instead of `useContext(AuthContext)`
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}