// src/components/ProtectedRoute.jsx
// Wraps routes that require authentication.

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Show a loading state while we check localStorage on boot
  if (loading) {
    return (
      <div className="container">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  // Not logged in? Redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in — render the protected content
  return children;
}

export default ProtectedRoute;