import { describe, it, expect } from 'vitest';
import {
  getBufferHealthColor,
  getHealthStatusFromMetrics,
} from '../calculations';

describe('getBufferHealthColor', () => {
  it('returns Critical for buffer < 100ms', () => {
    expect(getBufferHealthColor(50)).toEqual({
      color: 'text-danger',
      status: 'Critical',
      variant: 'destructive',
    });
  });

  it('returns Warning for buffer < 500ms', () => {
    expect(getBufferHealthColor(200)).toEqual({
      color: 'text-warning',
      status: 'Warning',
      variant: 'secondary',
    });
  });

  it('returns Healthy for buffer >= 500ms', () => {
    expect(getBufferHealthColor(1000)).toEqual({
      color: 'text-info',
      status: 'Healthy',
      variant: 'default',
    });
  });
});

describe('getHealthStatusFromMetrics', () => {
  it('returns Critical when disconnected', () => {
    const result = getHealthStatusFromMetrics(500_000, false, true, 0);
    expect(result.status).toBe('Critical');
  });

  it('returns Critical when wouldBlock', () => {
    const result = getHealthStatusFromMetrics(500_000, true, false, 0);
    expect(result.status).toBe('Critical');
  });

  it('returns Warning for low buffer (< 100ms in μs)', () => {
    const result = getHealthStatusFromMetrics(50_000, false, false, 0);
    expect(result.status).toBe('Warning');
  });

  it('returns Warning for high queued packets', () => {
    const result = getHealthStatusFromMetrics(500_000, false, false, 200);
    expect(result.status).toBe('Warning');
  });

  it('returns Healthy when all metrics are good', () => {
    const result = getHealthStatusFromMetrics(500_000, false, false, 10);
    expect(result.status).toBe('Healthy');
  });
});
