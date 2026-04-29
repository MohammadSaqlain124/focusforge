// src/components/DurationDisplay.jsx
// Shows elapsed *focus* time. Subtracts ALL break durations precisely.
// If frozenAt is provided, freezes display at that timestamp.
// If plannedDuration is provided and exceeded, the display turns amber.

import { useState, useEffect } from 'react';

function DurationDisplay({ startTime, plannedDuration, frozenAt, breaks = [] }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (frozenAt) return; // no need to tick when frozen

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [frozenAt]);

  // Wall-clock elapsed (or up to frozenAt)
  const endRef = frozenAt ? new Date(frozenAt).getTime() : now;
  const start = new Date(startTime).getTime();
  const wallClockMs = Math.max(0, endRef - start);

  // Sum precise break durations from the breaks array
  // (millisecond precision, no rounding errors)
  let totalBreakMs = 0;
  for (const b of breaks) {
    if (!b.startedAt) continue;
    const breakStart = new Date(b.startedAt).getTime();
    // Active break: count up to "now" (or frozenAt). Otherwise use endedAt.
    const breakEnd = b.endedAt ? new Date(b.endedAt).getTime() : endRef;
    if (breakEnd > breakStart) {
      totalBreakMs += (breakEnd - breakStart);
    }
  }

  // Honest focus time
  const focusMs = Math.max(0, wallClockMs - totalBreakMs);
  const totalSeconds = Math.floor(focusMs / 1000);
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

  // Over-time uses focus minutes
  const isOverTime = !frozenAt && plannedDuration && minutes >= plannedDuration;
  const minutesOver = isOverTime ? minutes - plannedDuration : 0;

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