// src/components/BreakCountdown.jsx
// Counts down a break: shows time remaining. Goes amber when < 60s, red when overrun.
// onExpire fires once when the break duration is exhausted.

import { useState, useEffect, useRef } from 'react';

function BreakCountdown({ breakStartedAt, plannedDuration, onExpire }) {
  const [now, setNow] = useState(Date.now());
  const expiredRef = useRef(false); // ensures onExpire only fires once

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const start = new Date(breakStartedAt).getTime();
  const elapsedMs = now - start;
  const plannedMs = plannedDuration * 60 * 1000;
  const remainingMs = plannedMs - elapsedMs;

  // Format remaining (or overrun) time
  const isOverrun = remainingMs < 0;
  const absMs = Math.abs(remainingMs);
  const totalSeconds = Math.floor(absMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // Trigger onExpire once when break time runs out
  useEffect(() => {
    if (isOverrun && !expiredRef.current && onExpire) {
      expiredRef.current = true;
      onExpire();
    }
  }, [isOverrun, onExpire]);

  // Color: green > 60s, amber < 60s, red overrun
  let color;
  if (isOverrun) color = '#ff6b6b';
  else if (remainingMs < 60_000) color = '#ffa94d';
  else color = '#10B981';

  const display = `${minutes}m ${String(seconds).padStart(2, '0')}s`;

  return (
    <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color }}>
      {isOverrun ? `${display} over` : display}
    </span>
  );
}

export default BreakCountdown;