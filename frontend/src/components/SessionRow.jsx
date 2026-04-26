// src/components/SessionRow.jsx
// Renders a single session as a list row.

function SessionRow({ session }) {
  const {
    goal,
    plannedDuration,
    actualDuration,
    breaksTaken,
    status,
    startedAt,
    tags,
  } = session;

  // Status badge styling
  const statusStyles = {
    active: { background: '#7c5cff', color: 'white' },
    completed: { background: '#51cf66', color: '#0a3a14' },
    abandoned: { background: '#ff6b6b', color: '#3a0a0a' },
  };

  const statusLabels = {
    active: '🔥 Active',
    completed: '✅ Completed',
    abandoned: '❌ Abandoned',
  };

  // Format date as "Apr 26, 9:14 AM"
  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div
      style={{
        padding: '1rem',
        borderBottom: '1px solid #2a2a2e',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      {/* Top row: goal + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{goal}</p>
          <p className="text-muted" style={{ fontSize: '0.8rem' }}>
            {formatDate(startedAt)}
          </p>
        </div>
        <span
          style={{
            ...statusStyles[status],
            padding: '0.25rem 0.6rem',
            borderRadius: 12,
            fontSize: '0.75rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {statusLabels[status]}
        </span>
      </div>

      {/* Bottom row: stats */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem' }}>
        <span className="text-muted">
          Planned: <span style={{ color: '#e6e6e6' }}>{plannedDuration} min</span>
        </span>
        {status !== 'active' && (
          <span className="text-muted">
            Actual: <span style={{ color: '#e6e6e6' }}>{actualDuration} min</span>
          </span>
        )}
        <span className="text-muted">
          Breaks: <span style={{ color: '#e6e6e6' }}>{breaksTaken}</span>
        </span>
        {tags?.length > 0 && (
          <span className="text-muted">
            Tags: <span style={{ color: '#e6e6e6' }}>{tags.join(', ')}</span>
          </span>
        )}
      </div>
    </div>
  );
}

export default SessionRow;