import { useState, useEffect } from 'react';

interface AdaptiveChartHeightOptions {
  min?: number;
  max?: number;
  viewportFraction?: number; // proportion of window.innerHeight used as target height (0–1)
}

export function useAdaptiveChartHeight({
  min = 180,
  max = 320,
  viewportFraction = 0.22,
}: AdaptiveChartHeightOptions = {}): number {
  const compute = () =>
    Math.max(
      min,
      Math.min(max, Math.floor(window.innerHeight * viewportFraction)),
    );

  const [height, setHeight] = useState(compute);

  useEffect(() => {
    const onResize = () => setHeight(compute());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [min, max, viewportFraction]);

  return height;
}
