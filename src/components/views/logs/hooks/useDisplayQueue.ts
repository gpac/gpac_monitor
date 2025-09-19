import { useState, useEffect, useRef } from 'react';

/**
 * Hook to throttle UI updates using requestAnimationFrame for optimal performance.
 * Decouples data reception from display updates to prevent main thread blocking
 * during high-frequency log streams.
 *
 * @param getValue - Function that returns the current value
 * @returns Throttled display data synced with browser refresh rate
 */
export function useDisplayQueue<T>(getValue: () => T): T {
  const [displayData, setDisplayData] = useState<T>(getValue);
  const lastValueRef = useRef<T>(getValue());
  const rafIdRef = useRef<number>();

  // Update reference on every getValue change
  useEffect(() => {
    lastValueRef.current = getValue();
  });

  useEffect(() => {
    const updateDisplay = () => {
      setDisplayData(lastValueRef.current);
      rafIdRef.current = requestAnimationFrame(updateDisplay);
    };

    // Start the animation loop
    rafIdRef.current = requestAnimationFrame(updateDisplay);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return displayData;
}