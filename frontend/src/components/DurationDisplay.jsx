// src/components/DurationDisplay.jsx
// Shows elapsed time. If plannedDuration is provided and exceeded,
// the display turns amber and shows "X min over".

import { useState, useEffect } from 'react';

function DurationDisplay({ startTime, plannedDuration }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate elapsed
  const start = new Date(startTime).getTime();
  const elapsedMs = now - start;
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hours = Math.floor(minutes / 60);
  const displayMinutes = minutes % 60;

  let display;
  if (hours > 0) {
    display = `${hours}h ${displayMinutes}m ${seconds}s`;
  } else {
    display = `${displayMinutes}m ${seconds}s`;
  }

  // Determine over-time state
  const isOverTime = plannedDuration && minutes >= plannedDuration;
  const minutesOver = isOverTime ? minutes - plannedDuration : 0;

  // Color: amber when over, default white when on-pace
  const color = isOverTime ? '#ffa94d' : 'inherit';

  return (
    <span style={{ display: 'inline-block' }}>
      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color }}>
        {display}
      </span>
      {isOverTime && (
        <span
          style={{
            marginLeft: '0.5rem',
            fontSize: '0.7em',
            color: '#ffa94d',
            fontWeight: 500,
          }}
        >
          ({minutesOver} min over)
        </span>
      )}
    </span>
  );
}

export default DurationDisplay;