// src/components/WeeklyStatsCard.jsx

function WeeklyStatsCard({ data }) {
  if (!data) return null;

  const {
    totalFocusMinutes,
    completedSessions,
    abandonedSessions,
    abandonmentRate,
    avgSessionLength,
    peakHour,
    peakDayOfWeek,
    dailyBreakdown,
  } = data;

  // Format peak hour as "2 PM" instead of 14
  const formatHour = (hour) => {
    if (hour === null || hour === undefined) return '—';
    const period = hour >= 12 ? 'PM' : 'AM';
    const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${display} ${period}`;
  };

  // Find max focus minutes in the week (for bar chart scaling)
  const maxDayMinutes = dailyBreakdown.length > 0
    ? Math.max(...dailyBreakdown.map((d) => d.focusMinutes), 1) // at least 1 to avoid div-by-zero
    : 1;

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1rem' }}>📊 This week</h2>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <Stat label="Total focus time" value={`${totalFocusMinutes} min`} />
        <Stat label="Completed" value={completedSessions} />
        <Stat label="Abandoned" value={abandonedSessions} />
        <Stat label="Abandonment rate" value={`${Math.round(abandonmentRate * 100)}%`} />
        <Stat label="Avg session" value={`${avgSessionLength} min`} />
        <Stat label="Peak hour (UTC)" value={formatHour(peakHour)} />
        <Stat label="Peak day" value={peakDayOfWeek || '—'} />
      </div>

      {/* Daily breakdown chart */}
      <div>
        <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          Daily focus minutes (last 7 days)
        </p>

        {dailyBreakdown.length === 0 ? (
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            No completed sessions yet this week.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {dailyBreakdown.map((day) => {
              const widthPct = (day.focusMinutes / maxDayMinutes) * 100;
              return (
                <div key={day.date} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', width: 90, color: '#a0a0a8' }}>
                    {day.date}
                  </span>
                  <div style={{
                    flex: 1,
                    height: 22,
                    background: '#232328',
                    borderRadius: 4,
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${widthPct}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #7c5cff, #a78bfa)',
                      borderRadius: 4,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                  <span style={{ fontSize: '0.85rem', width: 70, textAlign: 'right' }}>
                    {day.focusMinutes} min
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Small reusable stat tile
function Stat({ label, value }) {
  return (
    <div>
      <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>
        {label}
      </p>
      <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>{value}</p>
    </div>
  );
}

export default WeeklyStatsCard;