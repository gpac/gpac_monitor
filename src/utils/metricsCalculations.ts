import { PIDData } from '@/types/domain/gpac/model';
import { TrendDirection } from '@/components/views/stats-session/types';

// Health status types
export interface HealthStatus {
  color: string;
  status: string;
  variant: 'default' | 'secondary' | 'destructive';
}

export interface ActivityLevel {
  level: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  color: string;
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

// Activity level calculations
export const getActivityLevel = (
  pckDone: number = 0,
  bytesDone: number = 0,
): string => {
  if (pckDone === 0 && bytesDone === 0) return 'idle';
  if (pckDone < 100) return 'low';
  if (pckDone < 1000) return 'medium';
  return 'high';
};

export const getActivityLabel = (level: string): string => {
  switch (level) {
    case 'idle':
      return 'Idle';
    case 'low':
      return 'Low';
    case 'medium':
      return 'Medium';
    case 'high':
      return 'High';
    default:
      return 'Unknown';
  }
};

// Network activity level based on byte rate
export const getNetworkActivityLevel = (byteRate: number): ActivityLevel => {
  if (byteRate > 10000000)
    return { level: 'High', variant: 'default', color: 'text-info' };
  if (byteRate > 1000000)
    return { level: 'Medium', variant: 'secondary', color: 'text-blue-600' };
  if (byteRate > 0)
    return { level: 'Low', variant: 'outline', color: 'text-warning' };
  return { level: 'Idle', variant: 'destructive', color: 'text-gray-500' };
};

// Buffer calculations
export const calculateBufferUsage = (
  ipid: Record<string, PIDData> = {},
): number => {
  const pidEntries = Object.values(ipid);
  if (pidEntries.length === 0) return 0;

  const totalUsage = pidEntries.reduce((sum, pid) => {
    if (pid.buffer_total > 0) {
      return sum + (pid.buffer / pid.buffer_total) * 100;
    }
    return sum;
  }, 0);

  return Math.min(Math.round(totalUsage / pidEntries.length), 100);
};

export const getBufferProgressColor = (usage: number): string => {
  if (usage < 50) return 'bg-info';
  if (usage < 80) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const getActivityColorClass = (level: string): string => {
  return (
    {
      high: 'bg-primary',
      medium: 'bg-muted',
      low: 'bg-muted',
      inactive: 'bg-muted/50',
    }[level] || 'bg-muted/50'
  );
};

// Trend analysis
export function determineTrend(
  currentValue: number | null,
  previousValue: number | null,
  threshold: number = 0.1,
): TrendDirection {
  if (currentValue === null || previousValue === null) {
    return 'stable';
  }

  const percentChange = Math.abs(
    (currentValue - previousValue) / previousValue,
  );

  if (percentChange < threshold) {
    return 'stable';
  }

  return currentValue > previousValue ? 'increasing' : 'decreasing';
}

// Status color mapping
const STATUS_COLORS = {
  active: 'bg-info',
  warning: 'bg-warning',
  error: 'bg-danger',
  default: 'bg-gray-500',
} as const;

export const getStatusColor = (status: string | undefined): string => {
  if (!status) return STATUS_COLORS.default;

  if (status.toLowerCase().includes('error')) {
    return STATUS_COLORS.error;
  }

  if (status.toLowerCase().includes('warning')) {
    return STATUS_COLORS.warning;
  }

  return STATUS_COLORS.active;
};
