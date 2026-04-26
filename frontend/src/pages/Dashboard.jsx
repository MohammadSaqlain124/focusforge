// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchActiveSession } from '../services/sessionService';
import {
  fetchStreak,
  fetchBurnoutCheck,
  fetchWeeklyInsights,
} from '../services/insightsService';
import ActiveSession from '../components/ActiveSession';
import StartSessionForm from '../components/StartSessionForm';
import StreakCard from '../components/StreakCard';
import BurnoutCard from '../components/BurnoutCard';
import WeeklyStatsCard from '../components/WeeklyStatsCard';
import SessionHistory from '../components/SessionHistory';
import Navbar from '../components/Navbar';
import LoadingSkeleton from '../components/LoadingSkeleton';

function Dashboard() {
  const { user } = useAuth();

  const [activeSession, setActiveSession] = useState(null);
  const [streak, setStreak] = useState(null);
  const [burnout, setBurnout] = useState(null);
  const [weekly, setWeekly] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [activeData, streakData, burnoutData, weeklyData] = await Promise.all([
        fetchActiveSession(),
        fetchStreak(),
        fetchBurnoutCheck(),
        fetchWeeklyInsights(),
      ]);

      setActiveSession(activeData);
      setStreak(streakData);
      setBurnout(burnoutData);
      setWeekly(weeklyData);
    } catch (err) {
      setError('Could not load dashboard data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshInsights = async () => {
    try {
      const [streakData, burnoutData, weeklyData] = await Promise.all([
        fetchStreak(),
        fetchBurnoutCheck(),
        fetchWeeklyInsights(),
      ]);
      setStreak(streakData);
      setBurnout(burnoutData);
      setWeekly(weeklyData);
    } catch (err) {
      console.error('Failed to refresh insights:', err);
    }
  };

  const handleSessionStarted = (newSession) => {
    setActiveSession(newSession);
    setRefreshKey((k) => k + 1);
  };

  const handleSessionEnded = () => {
    setActiveSession(null);
    refreshInsights();
    setRefreshKey((k) => k + 1);
  };

  const handleSessionUpdated = (updatedSession) => {
    setActiveSession(updatedSession);
    setRefreshKey((k) => k + 1);
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Navbar />
        <LoadingSkeleton />
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="card">
            <p className="text-error">{error}</p>
            <button className="btn btn-secondary" onClick={loadDashboard} style={{ marginTop: '0.5rem' }}>
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  // Main content
  return (
    <>
      <Navbar />
      <div className="container">
        {/* Greeting */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem' }}>Welcome back, {user?.name} 👋</h1>
          <p className="text-muted">
            {activeSession
              ? "Stay focused — you've got an active session running."
              : "Ready when you are."}
          </p>
        </div>

        {/* Active session OR start form */}
        {activeSession ? (
          <ActiveSession
            session={activeSession}
            onSessionEnded={handleSessionEnded}
            onSessionUpdated={handleSessionUpdated}
          />
        ) : (
          <StartSessionForm onSessionStarted={handleSessionStarted} />
        )}

        {/* Insights row */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <StreakCard data={streak} />
          <div style={{ flex: 2, minWidth: 280 }}>
            <BurnoutCard data={burnout} />
          </div>
        </div>

        {/* Weekly stats */}
        <div style={{ marginTop: '1rem' }}>
          <WeeklyStatsCard data={weekly} />
        </div>

        {/* Session history */}
        <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>
          <SessionHistory refreshKey={refreshKey} />
        </div>
      </div>
    </>
  );
}

export default Dashboard;