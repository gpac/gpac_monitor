import { LuFile, LuFileText, LuFilm, LuMusic } from 'react-icons/lu';
import {  GraphFilterData } from '../types/domain/gpac/model';
import { TrendDirection } from '@/components/views/stats-session/types';

// Types
export type TrendType = 'up' | 'down' | 'stable';
export type StatusColorType = string;

const STATUS_COLORS = {
  active: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  default: 'bg-gray-500',
} as const;

export const getStatusColor = (status: string | undefined): StatusColorType => {
  if (!status) return STATUS_COLORS.default;

  if (status.toLowerCase().includes('error')) {
    return STATUS_COLORS.error;
  }

  if (status.toLowerCase().includes('warning')) {
    return STATUS_COLORS.warning;
  }

  return STATUS_COLORS.active;
};

/**
 * Format bytes into human readable string
 */

export const formatBytes = (bytes: number | undefined): string => {
  const value = typeof bytes === 'number' ? bytes : 0;
  if (value === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(value) / Math.log(k));
  return `${parseFloat((value / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Determine the trend of the data
 */
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

/**
 * Verify if the data is valid
 */
export const isValidFilterData = (
  data: GraphFilterData | null,
): data is GraphFilterData => {
  return data !== null && typeof data === 'object';
};

// Get icon and label for media type
export const getMediaTypeInfo = (type: string) => {
  switch (type.toLowerCase()) {
    case 'visual':
      return { icon: LuFilm, label: 'Video', color: 'text-blue-500' };
    case 'audio':
      return { icon: LuMusic, label: 'Audio', color: 'text-green-500' };
    case 'text':
      return { icon: LuFileText, label: 'Text', color: 'text-yellow-500' };
    case 'file':
      return { icon: LuFile, label: 'File', color: 'text-purple-500' };
    default:
      return { icon: LuFilm, label: type || 'Unknown', color: 'text-gray-500' };
  }
};
