/**
 * Consolidated formatting utilities - eliminates duplicates from helper.ts, formatUtils.ts, filterMonitorUtils.ts
 */

// Bytes formatting - single consolidated version
export const formatBytes = (bytes: number | undefined): string => {
  const value = typeof bytes === 'number' ? bytes : 0;
  if (value === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(value) / Math.log(k));
  return `${parseFloat((value / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Time formatting - microseconds to human readable
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

// Buffer time formatting - microseconds to ms/s
export const formatBufferTime = (microseconds: number): string => {
  if (microseconds === 0) return '0 ms';
  const milliseconds = microseconds / 1000;
  if (milliseconds >= 1000) return `${(milliseconds / 1000).toFixed(1)} s`;
  return `${Math.floor(milliseconds)} ms`;
};

// Bitrate formatting
export const formatBitrate = (bitrate: number | undefined): string => {
  if (!bitrate) return '0 b/s';
  if (bitrate >= 1000000000) return `${(bitrate / 1000000000).toFixed(2)} Gb/s`;
  if (bitrate >= 1000000) return `${(bitrate / 1000000).toFixed(2)} Mb/s`;
  if (bitrate >= 1000) return `${(bitrate / 1000).toFixed(2)} Kb/s`;
  return `${bitrate.toFixed(0)} b/s`;
};

// Packet rate formatting
export const formatPacketRate = (rate: number | undefined): string => {
  if (!rate) return '0 pck/s';
  if (rate >= 1000000) return `${(rate / 1000000).toFixed(2)} Mpck/s`;
  if (rate >= 1000) return `${(rate / 1000).toFixed(2)} Kpck/s`;
  return `${rate.toFixed(0)} pck/s`;
};

// Number formatting
export const formatNumber = (num: number): string => {
  if (num < 1000) return num.toString();
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
  return (num / 1000000000).toFixed(1) + 'G';
};

// Percentage formatting
export const formatPercent = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Formatted time for dates
export const getFormattedTime = (
  date: Date = new Date(),
  includeHour = true,
): string => {
  const options: Intl.DateTimeFormatOptions = {
    minute: '2-digit',
    second: '2-digit',
  };
  if (includeHour) {
    options.hour = '2-digit';
  }
  return date.toLocaleTimeString([], options);
};