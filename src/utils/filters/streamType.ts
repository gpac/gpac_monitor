import { FilterType, GraphFilterData } from '@/types/domain/gpac';
import { IconType } from 'react-icons';
import { LuVideo, LuMusic, LuFileText, LuFile } from 'react-icons/lu';

/**
 * Stream type information including colors, CSS classes, and icons
 */
export interface StreamTypeInfo {
  type: FilterType;
  color: string;
  colorClass: string;
  label: string;
  icon: IconType;
}

/**
 * Color constants for filter types (synchronized with GraphOperations)
 */
export const FILTER_COLORS: Record<FilterType, string> = {
  video: '#3b82f6',
  audio: '#10b981',
  text: '#f59e0b',
  file: '#E11D48',
};

/**
 * CSS color classes for filter types (from index.css)
 */
export const FILTER_COLOR_CLASSES: Record<FilterType, string> = {
  video: 'text-debug',
  audio: 'text-info',
  text: 'text-warning',
  file: 'text-danger',
};

/**
 * Icons for filter types
 */
export const FILTER_ICONS: Record<FilterType, IconType> = {
  video: LuVideo,
  audio: LuMusic,
  text: LuFileText,
  file: LuFile,
};

/**
 * Labels for filter types
 */
export const FILTER_LABELS: Record<FilterType, string> = {
  video: 'Video',
  audio: 'Audio',
  text: 'Text',
  file: 'File',
};

/**
 * Get color for a filter type
 */
export const getFilterColor = (filterType: FilterType): string => {
  return FILTER_COLORS[filterType];
};

/**
 * Get complete stream type information
 */
export const getStreamTypeInfo = (filterType: FilterType): StreamTypeInfo => {
  return {
    type: filterType,
    color: FILTER_COLORS[filterType],
    colorClass: FILTER_COLOR_CLASSES[filterType],
    label: FILTER_LABELS[filterType],
    icon: FILTER_ICONS[filterType],
  };
};

/**
 * Determine filter type based on PID stream types
 * Extracted from GraphOperations for reusability
 */
const determineFilterType = (filter: GraphFilterData): FilterType => {
  // Use server-provided stream_type from PIDs for robust typing
  const streamTypes = new Set<string>();

  // Collect stream types from output PIDs
  if (filter.opid) {
    Object.values(filter.opid).forEach((pid) => {
      if (pid.stream_type) streamTypes.add(pid.stream_type.toLowerCase());
    });
  }

  // Fallback to input PIDs if no output
  if (streamTypes.size === 0 && filter.ipid) {
    Object.values(filter.ipid).forEach((pid) => {
      if (pid.stream_type) streamTypes.add(pid.stream_type.toLowerCase());
    });
  }

  // Map GPAC stream types to UI filter types
  if (streamTypes.has('visual')) return 'video';
  if (streamTypes.has('audio')) return 'audio';
  if (streamTypes.has('text')) return 'text';
  if (streamTypes.has('file')) return 'file';
  return 'file';
};

export { determineFilterType };
