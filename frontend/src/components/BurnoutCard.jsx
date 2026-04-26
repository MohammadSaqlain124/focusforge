// src/components/BurnoutCard.jsx

function BurnoutCard({ data }) {
  if (!data) return null;

  const { riskLevel, score, reasons, recommendation, sessionsAnalyzed } = data;

  // Color-code by risk level
  const colors = {
    low: '#51cf66',
    medium: '#ffa94d',
    high: '#ff6b6b',
  };
  const labels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Burnout risk (last 24h)</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: colors[riskLevel] }}>
            {labels[riskLevel]}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Sessions analyzed</p>
          <p style={{ fontSize: '1.25rem' }}>{sessionsAnalyzed}</p>
        </div>
      </div>

      {reasons && reasons.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            Why this score:
          </p>
          <ul style={{ paddingLeft: '1.25rem' }}>
            {reasons.map((reason, idx) => (
              <li key={idx} style={{ marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{
        background: '#232328',
        padding: '0.75rem 1rem',
        borderRadius: 8,
        borderLeft: `3px solid ${colors[riskLevel]}`,
      }}>
        <p style={{ fontSize: '0.9rem' }}>
          💡 <strong>Recommendation:</strong> {recommendation}
        </p>
      </div>
    </div>
  );
}

export default BurnoutCard;