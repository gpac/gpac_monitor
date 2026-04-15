import { describe, it, expect } from 'vitest';
import { prepareCpuMemoryData, calculateMemoryYMax } from '../cpuMemory';

describe('prepareCpuMemoryData', () => {
  it('returns empty arrays for empty input', () => {
    const result = prepareCpuMemoryData([]);
    expect(result.timeLabels).toEqual([]);
    expect(result.cpuData).toEqual([]);
    expect(result.memoryData).toEqual([]);
  });

  it('computes integer indices and formatted time labels from timestamps', () => {
    const points = [
      { timestamp: 1000, cpu_percent: 10, memory_mb: 50 },
      { timestamp: 2000, cpu_percent: 20, memory_mb: 60 },
      { timestamp: 3000, cpu_percent: 30, memory_mb: 70 },
    ];
    const result = prepareCpuMemoryData(points);

    expect(result.alignedData[0]).toEqual([0, 1, 2]);
    expect(result.timeLabels).toHaveLength(3);
    expect(result.cpuData).toEqual([10, 20, 30]);
    expect(result.memoryData).toEqual([50, 60, 70]);
  });

  it('returns alignedData as [indices, memory, cpu]', () => {
    const points = [{ timestamp: 0, cpu_percent: 5, memory_mb: 100 }];
    const result = prepareCpuMemoryData(points);

    expect(result.alignedData).toEqual([[0], [100], [5]]);
  });
});

describe('calculateMemoryYMax', () => {
  it('returns minimum scale of 100 for small values', () => {
    expect(calculateMemoryYMax(10)).toBe(100);
  });

  it('rounds up to nearest 50 with 1.5x headroom', () => {
    expect(calculateMemoryYMax(200)).toBe(300);
    expect(calculateMemoryYMax(400)).toBe(600);
  });
});
