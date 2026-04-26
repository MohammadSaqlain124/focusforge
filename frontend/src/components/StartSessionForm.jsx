// src/components/StartSessionForm.jsx

import { useState } from 'react';
import { startSession } from '../services/sessionService';

function StartSessionForm({ onSessionStarted }) {
  const [goal, setGoal] = useState('');
  const [plannedDuration, setPlannedDuration] = useState(25);
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Convert comma-separated tags string into array
      // "DSA, deep-work" → ["DSA", "deep-work"]
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const newSession = await startSession({
        goal,
        plannedDuration: parseInt(plannedDuration),
        tags,
      });

      // Tell the parent component a session was started
      // (Parent will refresh its state to show the active session)
      onSessionStarted(newSession);

      // Reset form
      setGoal('');
      setPlannedDuration(25);
      setTagsInput('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to start session.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h2>Start a focus session</h2>
      <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
        Set a goal and a duration. The clock starts immediately.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="goal">What are you working on?</label>
          <input
            id="goal"
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g., Study sorting algorithms"
            required
            maxLength={200}
          />
        </div>

        <div className="form-group">
          <label htmlFor="duration">Planned duration (minutes)</label>
          <input
            id="duration"
            type="number"
            min="1"
            max="240"
            value={plannedDuration}
            onChange={(e) => setPlannedDuration(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags (optional, comma-separated)</label>
          <input
            id="tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g., DSA, deep-work"
          />
        </div>

        {error && <p className="text-error" style={{ marginBottom: '1rem' }}>{error}</p>}

        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Starting…' : 'Start session'}
        </button>
      </form>
    </div>
  );
}

export default StartSessionForm;