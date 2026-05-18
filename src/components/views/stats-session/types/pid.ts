import type { FilterStatsResponse, TabPIDData } from '@/types';

export type PIDMetricMode =
  | 'bitrate'
  | 'buffer'
  | 'processTime'
  | 'processRate'
  | 'ts';

export interface PIDMetricSample {
  sessionTimestampUs: number;
  averageBitrate?: number | null;
  bufferTime?: number | null;
  processTime?: number | null;
  processRate?: number | null;
  ts?: number | null;
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
 * pidIdx is the 0-based position index in the parent filter's pid list
 */
export interface PIDWithIndex extends TabPIDData {
  pidIdx: number;
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
