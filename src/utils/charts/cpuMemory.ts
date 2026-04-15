import uPlot from 'uplot';
import { formatChartSeconds } from '@/utils/formatting/time';

export interface CpuMemoryDataPoint {
  timestamp: number;
  time?: string;
  cpu_percent: number;
  memory_mb: number;
}

export interface PreparedCpuMemoryData {
  alignedData: uPlot.AlignedData;
  timeLabels: string[];
  memoryData: number[];
  cpuData: number[];
}

/**
 * Prepare CPU/Memory chart data for uPlot.
 * x-axis = integer indices [0, 1, ..., n-1] — stable range regardless of time span.
 * timeLabels = formatted relative-second strings for axis/tooltip display.
 */
export function prepareCpuMemoryData(
  dataPoints: CpuMemoryDataPoint[],
): PreparedCpuMemoryData {
  const firstTimestamp = dataPoints.length > 0 ? dataPoints[0].timestamp : 0;

  const indices = dataPoints.map((_, i) => i);
  const timeLabels = dataPoints.map((p) =>
    formatChartSeconds((p.timestamp - firstTimestamp) / 1000),
  );
  const memoryData = dataPoints.map((p) => p.memory_mb);
  const cpuData = dataPoints.map((p) => p.cpu_percent);

  const alignedData: uPlot.AlignedData = [indices, memoryData, cpuData];

  return {
    alignedData,
    timeLabels,
    memoryData,
    cpuData,
  };
}

/**
 * Calculate dynamic memory Y-axis max value
 */
export function calculateMemoryYMax(currentMemoryMB: number): number {
  const minScale = 100;
  const roundTo = 50;
  const calculated = Math.ceil((currentMemoryMB * 1.5) / roundTo) * roundTo;
  return Math.max(minScale, calculated);
}
