// src/components/Navbar.jsx
// App-wide navigation bar.

import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav
      style={{
        background: '#0a0a0b',
        borderBottom: '1px solid #2a2a2e',
        padding: '1rem 0',
        marginBottom: '2rem',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 1rem',
        }}
      >
        {/* Logo / brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🔥</span>
          <h1 style={{ fontSize: '1.25rem', margin: 0 }}>FocusForge</h1>
        </div>

        {/* User info + logout */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="text-muted" style={{ fontSize: '0.9rem' }}>
              {user.name}
            </span>
            <button
              className="btn btn-secondary"
              onClick={handleLogout}
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;