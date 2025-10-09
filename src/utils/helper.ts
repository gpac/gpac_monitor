import { PIDData } from '@/types/domain/gpac/model';

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const formatTime = (microseconds?: number): string => {
  if (microseconds === undefined) return '0 ms';
  if (microseconds < 1000) return `${microseconds.toFixed(0)} μs`;

  const milliseconds = microseconds / 1000;
  if (milliseconds < 1000) return `${milliseconds.toFixed(2)} ms`;

  const seconds = milliseconds / 1000;
  if (seconds < 60) return `${seconds.toFixed(2)} s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds.toFixed(0)}s`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m ${remainingSeconds.toFixed(0)}s`;
};

export const microsecondsToSeconds = (microseconds: number): number => {
  if (microseconds === 0) return 1; // Avoid division by zero
  const milliseconds = microseconds / 1000;
  return milliseconds / 1000;
};

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
  if (usage < 50) return 'bg-green-500';
  if (usage < 80) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const formatNumber = (num: number): string => {
  if (num < 1000) return num.toString();
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
  return (num / 1000000000).toFixed(1) + 'G';
};

export const formatBitrate = (bitrate: number | undefined): string => {
  if (!bitrate) return '0 b/s';
  if (bitrate >= 1000000000) return `${(bitrate / 1000000000).toFixed(2)} Gb/s`;
  if (bitrate >= 1000000) return `${(bitrate / 1000000).toFixed(2)} Mb/s`;
  if (bitrate >= 1000) return `${(bitrate / 1000).toFixed(2)} Kb/s`;
  return `${bitrate.toFixed(0)} b/s`;
};

export const roundNumber = (num: number, decimals: number = 2): number => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

export const formatPacketRate = (
  rate: number | undefined,
  decimals: number = 2,
): string => {
  if (!rate) return '0 pck/s';
  if (rate >= 1000000) return `${(rate / 1000000).toFixed(decimals)} Mpck/s`;
  if (rate >= 1000) return `${(rate / 1000).toFixed(decimals)} Kpck/s`;
  return `${rate.toFixed(0)} pck/s`;
};

export const formatBufferTime = (microseconds: number): string => {
  if (microseconds === 0) return '0 ms';
  const milliseconds = microseconds / 1000;
  if (milliseconds >= 1000) return `${(milliseconds / 1000).toFixed(1)} s`;
  return `${Math.floor(milliseconds)} ms`;
};

export const getBufferHealthColor = (
  bufferMs: number,
): {
  color: string;
  status: string;
  variant: 'default' | 'secondary' | 'destructive';
} => {
  if (bufferMs < 100)
    return {
      color: 'text-red-500',
      status: 'Critical',
      variant: 'destructive',
    };
  if (bufferMs < 500)
    return {
      color: 'text-orange-500',
      status: 'Warning',
      variant: 'secondary',
    };
  return { color: 'text-green-500', status: 'Healthy', variant: 'default' };
};

export const getHealthStatusFromMetrics = (
  buffer: number,
  wouldBlock: boolean,
  disconnected: boolean,
  queuedPackets: number,
): {
  color: string;
  status: string;
  variant: 'default' | 'secondary' | 'destructive';
} => {
  if (disconnected || wouldBlock) {
    return {
      color: 'text-red-500',
      status: 'Critical',
      variant: 'destructive',
    };
  }

  const bufferMs = buffer / 1000;
  if (bufferMs < 100 || queuedPackets > 100) {
    return {
      color: 'text-orange-500',
      status: 'Warning',
      variant: 'secondary',
    };
  }

  return { color: 'text-green-500', status: 'Healthy', variant: 'default' };
};
