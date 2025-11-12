import { useState, useEffect, useRef } from 'react';

export function useDisplayQueue<T>(value: T): T {
  const [display, setDisplay] = useState(value);
  const latest = useRef(value);
  const raf = useRef<number | undefined>();

  // Update display on next frame when value changes
  useEffect(() => {
    latest.current = value;

    if (display === value || raf.current !== undefined) {
      return;
    }

    // Schedule single RAF update
    raf.current = requestAnimationFrame(() => {
      setDisplay(latest.current);
      raf.current = undefined;
    });

    return () => {
      if (raf.current !== undefined) {
        cancelAnimationFrame(raf.current);
        raf.current = undefined;
      }
    };
  }, [value, display]);

  return display;
}
