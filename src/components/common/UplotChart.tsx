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
 * Ultra-performant canvas-based charting for real-time monitoring
 */
export const UplotChart = memo(
  ({ data, options, className, onCreate, onDestroy }: UplotChartProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<uPlot | null>(null);

    useEffect(() => {
      if (!containerRef.current) return;

      const chart = new uPlot(options, data, containerRef.current);
      chartRef.current = chart;
      onCreate?.(chart);

      return () => {
        onDestroy?.(chart);
        chart.destroy();
        chartRef.current = null;
      };
    }, [options, onCreate, onDestroy]);

    useEffect(() => {
      if (chartRef.current && data) {
        chartRef.current.setData(data);
      }
    }, [data]);

    return <div ref={containerRef} className={className} />;
  },
  (prev, next) => {
    return (
      prev.data === next.data &&
      prev.options === next.options &&
      prev.className === next.className
    );
  },
);

UplotChart.displayName = 'UplotChart';
