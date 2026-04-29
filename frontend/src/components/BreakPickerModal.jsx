// src/components/BreakPickerModal.jsx
// Modal for picking break duration. Calls onConfirm(duration) when user picks,
// or onCancel() if they back out.

import { useState, useEffect } from 'react';

const PRESETS = [5, 10, 15, 30];

function BreakPickerModal({ onConfirm, onCancel, isSubmitting }) {
  const [selected, setSelected] = useState(10); // default 10 min
  const [customValue, setCustomValue] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [error, setError] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel, isSubmitting]);

  const handleConfirm = () => {
    let duration;
    if (useCustom) {
      const parsed = parseInt(customValue, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 60) {
        setError('Custom duration must be between 1 and 60 minutes.');
        return;
      }
      duration = parsed;
    } else {
      duration = selected;
    }
    setError('');
    onConfirm(duration);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={(e) => {
        // Click outside modal to cancel (but only on overlay, not inside)
        if (e.target === e.currentTarget && !isSubmitting) onCancel();
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 460,
          width: '100%',
          borderColor: '#7c5cff',
        }}
      >
        <h2 style={{ marginBottom: '0.4rem' }}>☕ How long is your break?</h2>
        <p className="text-muted" style={{ marginBottom: '1.2rem' }}>
          Pick a duration. Your session timer will pause until you resume.
        </p>

        {/* Preset buttons grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          {PRESETS.map((min) => {
            const isActive = !useCustom && selected === min;
            return (
              <button
                key={min}
                type="button"
                onClick={() => {
                  setUseCustom(false);
                  setSelected(min);
                  setError('');
                }}
                disabled={isSubmitting}
                style={{
                  padding: '0.7rem 0',
                  borderRadius: 8,
                  border: isActive ? '2px solid #7c5cff' : '1px solid #2a2a35',
                  background: isActive ? 'rgba(124, 92, 255, 0.15)' : 'transparent',
                  color: isActive ? '#fff' : '#ccc',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {min} min
              </button>
            );
          })}
        </div>

        {/* Custom toggle */}
        <div style={{ marginBottom: '1rem' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              color: '#aaa',
            }}
          >
            <input
              type="checkbox"
              checked={useCustom}
              onChange={(e) => {
                setUseCustom(e.target.checked);
                setError('');
              }}
              disabled={isSubmitting}
            />
            Custom duration
          </label>

          {useCustom && (
            <input
              type="number"
              min="1"
              max="60"
              placeholder="1–60 minutes"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              disabled={isSubmitting}
              autoFocus
              style={{
                width: '100%',
                marginTop: '0.5rem',
                padding: '0.6rem',
                borderRadius: 8,
                border: '1px solid #2a2a35',
                background: '#1a1a20',
                color: '#fff',
                fontSize: '1rem',
              }}
            />
          )}
        </div>

        {error && (
          <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginBottom: '0.8rem' }}>
            {error}
          </p>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: 8,
              border: '1px solid #2a2a35',
              background: 'transparent',
              color: '#ccc',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            style={{
              padding: '0.6rem 1.4rem',
              borderRadius: 8,
              border: 'none',
              background: '#7c5cff',
              color: '#fff',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? 'Starting…' : 'Start break'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BreakPickerModal;