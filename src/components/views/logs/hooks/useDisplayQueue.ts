import { useState, useEffect, useRef } from 'react';

export function useDisplayQueue<T>(value: T): T {
  const [display, setDisplay] = useState(value);
  const latest = useRef(value);
  const pending = useRef(false);
  const raf = useRef<number>();

  // Receive the new value
  useEffect(() => {
    latest.current = value;
    pending.current = true; // mark “something has changed”
  }, [value]);

  // Copy to UI state at rAF cadence, BUT only if different
  useEffect(() => {
    const tick = () => {
      if (pending.current && display !== latest.current) {
        pending.current = false;
        setDisplay(latest.current); // a single setState for a batch of updates
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== undefined) {
        cancelAnimationFrame(raf.current);
      }
    };
  }, [display]);

  return display;
}
