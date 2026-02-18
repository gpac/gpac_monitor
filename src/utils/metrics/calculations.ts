// Health status types
export interface HealthStatus {
  color: string;
  status: string;
  variant: 'default' | 'secondary' | 'destructive';
}

// Buffer health assessment
export const getBufferHealthColor = (bufferMs: number): HealthStatus => {
  if (bufferMs < 100)
    return {
      color: 'text-danger',
      status: 'Critical',
      variant: 'destructive',
    };
  if (bufferMs < 500)
    return {
      color: 'text-warning',
      status: 'Warning',
      variant: 'secondary',
    };
  return { color: 'text-info', status: 'Healthy', variant: 'default' };
};

// Comprehensive health status from multiple metrics
export const getHealthStatusFromMetrics = (
  buffer: number,
  wouldBlock: boolean,
  disconnected: boolean,
  queuedPackets: number,
): HealthStatus => {
  if (disconnected || wouldBlock) {
    return {
      color: 'text-danger',
      status: 'Critical',
      variant: 'destructive',
    };
  }

  const bufferMs = buffer / 1000;
  if (bufferMs < 100 || queuedPackets > 100) {
    return {
      color: 'text-warning',
      status: 'Warning',
      variant: 'secondary',
    };
  }

  return { color: 'text-info', status: 'Healthy', variant: 'default' };
};
