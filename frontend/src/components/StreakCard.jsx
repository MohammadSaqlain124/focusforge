// src/components/StreakCard.jsx

function StreakCard({ data }) {
  if (!data) return null;

  const { streak, message } = data;
  const flames = streak > 0 ? '🔥' : '🌱';

  return (
    <div className="card" style={{ flex: 1, minWidth: 200 }}>
      <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
        Current streak
      </p>
      <p style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        {flames} {streak} {streak === 1 ? 'day' : 'days'}
      </p>
      <p className="text-muted" style={{ fontSize: '0.9rem' }}>
        {message}
      </p>
    </div>
  );
}

export default StreakCard;