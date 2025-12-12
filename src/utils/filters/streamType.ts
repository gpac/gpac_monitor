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
 * Get border color class for media type (from GPAC stream_type)
 */
export const getBorderColorForMediaType = (type: string): string => {
  const t = type.toLowerCase();
  if (t === 'visual' || t === 'video') return MEDIA_BORDER_COLORS.video;
  if (t === 'audio') return MEDIA_BORDER_COLORS.audio;
  if (t === 'text') return MEDIA_BORDER_COLORS.text;
  return MEDIA_BORDER_COLORS.file;
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
