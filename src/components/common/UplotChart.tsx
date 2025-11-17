import { useEffect, useRef, memo } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

export interface UplotChartProps {
  data: uPlot.AlignedData;
  options: uPlot.Options;
  className?: string;
  onCreate?: (chart: uPlot) => void;
  onDestroy?: (chart: uPlot) => void;
}

/**
 * Low-level wrapper for uPlot chart
 *
 */
export const UplotChart = memo(
  ({ data, options, className, onCreate, onDestroy }: UplotChartProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<uPlot | null>(null);
    const onCreateRef = useRef(onCreate);
    const onDestroyRef = useRef(onDestroy);

    // Keep refs up to date
    useEffect(() => {
      onCreateRef.current = onCreate;
      onDestroyRef.current = onDestroy;
    });

    // Create chart - recreate only when options change (memoized by parent)
    useEffect(() => {
      if (!containerRef.current) return;

      const chart = new uPlot(options, data, containerRef.current);
      chartRef.current = chart;
      onCreateRef.current?.(chart);

      return () => {
        if (!chartRef.current) return;
        onDestroyRef.current?.(chartRef.current);
        chartRef.current.destroy();
        chartRef.current = null;
      };
    }, [options]); // Options is memoized by parent - stable unless data changes

    // Update size without recreating chart
    useEffect(() => {
      if (!chartRef.current) return;
      const { width, height } = options;

      if (typeof width === 'number' && typeof height === 'number') {
        chartRef.current.setSize({ width, height });
      }
    }, [options.width, options.height]);

    // Update data without recreating chart
    useEffect(() => {
      if (!chartRef.current) return;
      chartRef.current.setData(data);
    }, [data]);

    return <div ref={containerRef} className={className} />;
  },
  (prev, next) => {
    // Memo based on stable references (parent should memoize options)
    return (
      prev.data === next.data &&
      prev.options === next.options &&
      prev.className === next.className
    );
  },
);

UplotChart.displayName = 'UplotChart';
