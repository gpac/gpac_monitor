import { BufferMetrics } from '../components/views/monitoring/types';

export function analyzeBufferMetrics(
  buffer: number,
  bufferTotal: number,
): BufferMetrics {
  const isDynamic = bufferTotal === -1;
  const usagePercentage = isDynamic ? 0 : (buffer / bufferTotal) * 100;

  let status: 'normal' | 'warning' | 'critical' = 'normal';
  if (!isDynamic) {
    if (usagePercentage > 90) status = 'critical';
    else if (usagePercentage > 75) status = 'warning';
  }

  return {
    current: buffer,
    total: bufferTotal,
    isDynamic,
    usagePercentage,
    status,
  };
}
export { parseFilterStatus } from './formatUtils';
