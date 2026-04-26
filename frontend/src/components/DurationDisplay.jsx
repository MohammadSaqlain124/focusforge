// src/components/DurationDisplay.jsx
// Shows elapsed time since `startTime`, ticking every second.

import { useState, useEffect } from 'react';

function DurationDisplay({ startTime }) {
  // State holds current "now" — gets updated every second
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Set up an interval that updates "now" every 1000ms
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    // Cleanup: clear interval when component unmounts
    // (otherwise we'd leak intervals every time this component is removed)
    return () => clearInterval(interval);
  }, []); // empty array = setup only once on mount

  // Calculate elapsed milliseconds
  const start = new Date(startTime).getTime();
  const elapsedMs = now - start;

  // Convert to minutes and seconds
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // Format: "12m 34s" or "1h 12m 34s"
  const hours = Math.floor(minutes / 60);
  const displayMinutes = minutes % 60;

  let display;
  if (hours > 0) {
    display = `${hours}h ${displayMinutes}m ${seconds}s`;
  } else {
    display = `${displayMinutes}m ${seconds}s`;
  }

  return (
    <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
      {display}
    </span>
  );
}

export default DurationDisplay;