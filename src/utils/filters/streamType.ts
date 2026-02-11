import {
  FilterType,
  GraphFilterData,
  GpacStreamType,
} from '@/types/domain/gpac';

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
 * Labels for filter types
 */
export const FILTER_LABELS: Record<FilterType, string> = {
  video: 'Video',
  audio: 'Audio',
  text: 'Text',
  file: 'File',
};

/**
 * Icon color classes for filter types (Tailwind CSS classes for text color)
 */
export const FILTER_ICON_COLORS: Record<FilterType, string> = {
  video: 'text-debug',
  audio: 'text-info',
  text: 'text-warning',
  file: 'text-danger',
};

/**
 * Border color classes for media types (used in PID cards)
 */
export const MEDIA_BORDER_COLORS: Record<FilterType, string> = {
  video: 'border-l-blue-500/60',
  audio: 'border-l-emerald-500/60',
  text: 'border-l-amber-500/60',
  file: 'border-l-slate-500/60',
};

/**
 * Get color for a filter type
 */
export const getFilterColor = (filterType: FilterType): string => {
  return FILTER_COLORS[filterType];
};

/**
 * Map string stream type to FilterType (case-insensitive, handles 'Visual', 'Video', etc.)
 */
export const STREAM_TYPE_TO_FILTER: Partial<
  Record<GpacStreamType, FilterType>
> = {
  [GpacStreamType.Visual]: 'video',
  [GpacStreamType.Audio]: 'audio',
  [GpacStreamType.Text]: 'text',
  [GpacStreamType.File]: 'file',
};

const mapStreamTypeToFilterType = (type: string): FilterType => {
  return STREAM_TYPE_TO_FILTER[type as GpacStreamType] ?? 'file';
};

/**
 * Get border color class for media type (from GPAC stream_type)
 */
export const getBorderColorForMediaType = (type: string): string => {
  const filterType = mapStreamTypeToFilterType(type);
  return MEDIA_BORDER_COLORS[filterType];
};

/**
 * Get hex color for media type (case-insensitive, handles 'Visual', 'Video', etc.)
 */
export const getColorForMediaType = (type: string): string => {
  const filterType = mapStreamTypeToFilterType(type);
  return FILTER_COLORS[filterType];
};

/**
 * Get icon color class for media type (case-insensitive, handles 'Visual', 'Video', etc.)
 */
export const getIconColorForMediaType = (type: string): string => {
  const filterType = mapStreamTypeToFilterType(type);
  return FILTER_ICON_COLORS[filterType];
};

/**
 * Determine filter type based on PID stream types
 * Extracted from GraphOperations for reusability
 */
const determineFilterType = (filter: GraphFilterData): FilterType => {
  // Collect stream types from output PIDs, fallback to input PIDs
  const pids =
    filter.opid && Object.keys(filter.opid).length > 0
      ? Object.values(filter.opid)
      : Object.values(filter.ipid ?? {});

  for (const pid of pids) {
    if (pid.stream_type) {
      const mapped = STREAM_TYPE_TO_FILTER[pid.stream_type];
      if (mapped) return mapped;
    }
  }
  return 'file';
};

export { determineFilterType };

/**
 * Get filter info by idx from filters array
 */
export const getFilterInfoByIdx = (
  filters: GraphFilterData[],
  filterIdx: number,
): {
  name: string;
  streamTypeColor: string;
  streamType: FilterType;
  streamTypeLabel: string;
} => {
  const filter = filters.find((f) => f.idx === filterIdx);
  if (!filter) {
    return {
      name: `Filter ${filterIdx}`,
      streamTypeColor: '#4CC9F0',
      streamType: 'file',
      streamTypeLabel: 'Unknown',
    };
  }
  const filterType = determineFilterType(filter);
  return {
    name: filter.name,
    streamTypeColor: FILTER_COLORS[filterType],
    streamType: filterType,
    streamTypeLabel: FILTER_LABELS[filterType],
  };
};
