// src/components/ActiveSession.jsx

import { useState } from 'react';
import { startBreak, endBreak, endSession } from '../services/sessionService';
import { requestNotificationPermission, showNotification } from '../utils/notifications';
import DurationDisplay from './DurationDisplay';
import BreakCountdown from './BreakCountdown';
import BreakPickerModal from './BreakPickerModal';

function ActiveSession({ session, onSessionEnded, onSessionUpdated }) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showBreakModal, setShowBreakModal] = useState(false);

  // Find the active break (the one with endedAt: null), if any
  const activeBreak = session.isOnBreak
    ? session.breaks?.find(b => !b.endedAt) || null
    : null;

  // Derive breaks count from the breaks array — source of truth
  const breaksCount = session.breaks?.length || 0;

  const handleOpenBreakModal = () => {
    setError('');
    setShowBreakModal(true);
  };

  const handleConfirmBreak = async (plannedDuration) => {
    try {
      setSubmitting(true);
      setError('');
      requestNotificationPermission();
      const updated = await startBreak(session._id, plannedDuration);
      setShowBreakModal(false);
      onSessionUpdated(updated);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to start break');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBreak = () => {
    setShowBreakModal(false);
  };

  const handleResume = async () => {
    setError('');
    setSubmitting(true);
    try {
      const updated = await endBreak(session._id);
      onSessionUpdated(updated);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to resume session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnd = async (status) => {
    setError('');
    setSubmitting(true);
    try {
      await endSession(session._id, status);
      onSessionEnded();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to end session.');
    } finally {
      setSubmitting(false);
    }
  };

  const elapsedMin = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 60000);
  const isOverTime = !session.isOnBreak && elapsedMin >= session.plannedDuration;

  const borderColor = session.isOnBreak ? '#ffa94d' : (isOverTime ? '#ffa94d' : '#7c5cff');

  return (
    <div className="card" style={{ borderColor }}>
      {isOverTime && (
        <div
          style={{
            background: 'rgba(255, 169, 77, 0.1)',
            border: '1px solid rgba(255, 169, 77, 0.3)',
            borderRadius: 8,
            padding: '0.6rem 0.9rem',
            marginBottom: '1rem',
            fontSize: '0.85rem',
            color: '#ffa94d',
          }}
        >
          ⏰ You've passed your planned duration. Click <strong>Complete</strong> when you're done — or it'll auto-end.
        </div>
      )}

      {session.isOnBreak && activeBreak && (
        <div
          style={{
            background: 'rgba(255, 169, 77, 0.12)',
            border: '1px solid rgba(255, 169, 77, 0.35)',
            borderRadius: 8,
            padding: '0.7rem 0.9rem',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            color: '#ffa94d',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span>
            ☕ <strong>On break</strong> — focus timer is paused.
          </span>
          <span>
            Time remaining:{' '}
            <BreakCountdown
              breakStartedAt={activeBreak.startedAt}
              plannedDuration={activeBreak.plannedDuration}
              onExpire={() => {
                showNotification('☕ Break is over', {
                  body: `Time to resume "${session.goal}".`,
                  tag: 'focusforge-break-end',
                });
              }}
            />
          </span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ marginBottom: '0.25rem' }}>
            {session.isOnBreak ? '⏸️ Session paused' : '🔥 Session in progress'}
          </h2>
          <p className="text-muted">{session.goal}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            {session.isOnBreak ? 'Paused at' : 'Elapsed'}
          </p>
          <p style={{ fontSize: '1.5rem' }}>
            <DurationDisplay
              startTime={session.startedAt}
              plannedDuration={session.plannedDuration}
              frozenAt={session.isOnBreak && activeBreak ? activeBreak.startedAt : null}
              breaks={session.breaks}
            />
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
          <p>{breaksCount}</p>
        </div>
        {session.totalBreakMinutes > 0 && (
          <div>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Total break time</p>
            <p>{session.totalBreakMinutes} min</p>
          </div>
        )}
        {session.tags?.length > 0 && (
          <div>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Tags</p>
            <p>{session.tags.join(', ')}</p>
          </div>
        )}
      </div>

      {error && <p className="text-error" style={{ marginTop: '1rem' }}>{error}</p>}

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {session.isOnBreak ? (
          <button
            className="btn"
            onClick={handleResume}
            disabled={submitting}
            style={{ background: '#10B981' }}
          >
            ▶️ Resume session
          </button>
        ) : (
          <button className="btn btn-secondary" onClick={handleOpenBreakModal} disabled={submitting}>
            ☕ Log break
          </button>
        )}
        <button className="btn" onClick={() => handleEnd('completed')} disabled={submitting}>
          ✅ Complete
        </button>
        <button className="btn btn-danger" onClick={() => handleEnd('abandoned')} disabled={submitting}>
          ❌ Abandon
        </button>
      </div>

      {showBreakModal && (
        <BreakPickerModal
          onConfirm={handleConfirmBreak}
          onCancel={handleCancelBreak}
          isSubmitting={submitting}
        />
      )}
    </div>
  );
}

export default ActiveSession;