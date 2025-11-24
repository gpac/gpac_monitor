import type { FilterStatsResponse, TabPIDData } from '@/types';

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
