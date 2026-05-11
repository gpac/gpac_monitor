import type { FilterStatsResponse, TabPIDData } from '@/types';

export type PIDMetricMode =
  | 'bitrate'
  | 'buffer'
  | 'processTime'
  | 'processRate';

export interface PIDMetricSample {
  sessionTimestampUs: number;
  bitrate?: number | null;
  bufferTime?: number | null;
  processTime?: number | null;
  processRate?: number | null;
}

export interface PIDGraphTarget {
  filterIdx: number;
  direction: 'input' | 'output';
  pidIndex: number;
  label?: string;
}

export const buildPIDKey = (
  filterIdx: number,
  direction: 'input' | 'output',
  pidIndex: number,
): string => `${filterIdx}:${direction}:${pidIndex}`;

/**
 * PID data with position index for edge mapping
 * ipidIdx is the position index (0, 1, 2...), NOT the key name
 */
export interface PIDWithIndex extends TabPIDData {
  ipidIdx: number;
}

/**
 * Props for InputsTab component
 */
export interface InputsTabProps {
  filterData: FilterStatsResponse;
  filterName: string;
  isLoading?: boolean;
}

/**
 * Props for InputCard component
 */
export interface InputCardProps {
  inputName: string;
  pidsByType: Record<string, PIDWithIndex[]>;
  filterIdx: number;
}
