import { FilterType, GraphFilterData } from '@/types/domain/gpac';

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
const mapStreamTypeToFilterType = (type: string): FilterType => {
  const t = type.toLowerCase();
  if (t === 'visual' || t === 'video') return 'video';
  if (t === 'audio') return 'audio';
  if (t === 'text') return 'text';
  return 'file';
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
