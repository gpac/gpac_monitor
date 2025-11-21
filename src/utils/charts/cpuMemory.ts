import uPlot from 'uplot';

export interface CpuMemoryDataPoint {
  timestamp: number;
  time?: string;
  cpu_percent: number;
  memory_mb: number;
}

export interface PreparedCpuMemoryData {
  alignedData: uPlot.AlignedData;
  relativeSeconds: number[];
  memoryData: number[];
  cpuData: number[];
}

/**
 * Prepare CPU/Memory chart data for uPlot
 * Pure utility function - no side effects, fully memoizable
 */
export function prepareCpuMemoryData(
  dataPoints: CpuMemoryDataPoint[],
): PreparedCpuMemoryData {
  const firstTimestamp = dataPoints.length > 0 ? dataPoints[0].timestamp : 0;

  const relativeSeconds = dataPoints.map(
    (p) => (p.timestamp - firstTimestamp) / 1000,
  );
  const memoryData = dataPoints.map((p) => p.memory_mb);
  const cpuData = dataPoints.map((p) => p.cpu_percent);

  const alignedData: uPlot.AlignedData = [relativeSeconds, memoryData, cpuData];

  return {
    alignedData,
    relativeSeconds,
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
