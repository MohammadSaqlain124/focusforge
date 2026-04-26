// src/components/ActiveSession.jsx

import { useState } from 'react';
import { logBreak, endSession } from '../services/sessionService';
import DurationDisplay from './DurationDisplay';

function ActiveSession({ session, onSessionEnded, onSessionUpdated }) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleBreak = async () => {
    setError('');
    setSubmitting(true);
    try {
      const updated = await logBreak(session._id);
      onSessionUpdated(updated);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log break.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnd = async (status) => {
    setError('');
    setSubmitting(true);
    try {
      await endSession(session._id, status);
      // Tell parent the session ended so it can switch UI back to "start" state
      onSessionEnded();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to end session.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ borderColor: '#7c5cff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ marginBottom: '0.25rem' }}>🔥 Session in progress</h2>
          <p className="text-muted">{session.goal}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Elapsed</p>
          <p style={{ fontSize: '1.5rem' }}>
            <DurationDisplay startTime={session.startedAt} />
          </p>
        </div>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Planned</p>
          <p>{session.plannedDuration} minutes</p>
        </div>
        <div>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Breaks taken</p>
          <p>{session.breaksTaken}</p>
        </div>
        {session.tags?.length > 0 && (
          <div>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Tags</p>
            <p>{session.tags.join(', ')}</p>
          </div>
        )}
      </div>

      {error && <p className="text-error" style={{ marginTop: '1rem' }}>{error}</p>}

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={handleBreak} disabled={submitting}>
          ☕ Log break
        </button>
        <button className="btn" onClick={() => handleEnd('completed')} disabled={submitting}>
          ✅ Complete
        </button>
        <button className="btn btn-danger" onClick={() => handleEnd('abandoned')} disabled={submitting}>
          ❌ Abandon
        </button>
      </div>
    </div>
  );
}

export default ActiveSession;