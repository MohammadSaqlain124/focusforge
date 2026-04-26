// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); // prevent default browser form submission
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // Backend returns { success: false, error: "..." }
      const msg = err.response?.data?.error || 'Login failed. Try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 400, margin: '4rem auto' }}>
        <h1>Welcome back</h1>
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
          Log in to continue your focus journey.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-error" style={{ marginBottom: '1rem' }}>{error}</p>}

          <button type="submit" className="btn" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="text-muted" style={{ marginTop: '1rem', textAlign: 'center' }}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;