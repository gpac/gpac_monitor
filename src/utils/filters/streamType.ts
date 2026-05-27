import {
  FilterType,
  GraphFilterData,
  GpacStreamType,
} from '@/types/domain/gpac';

export const DEFAULT_STREAM_COLOR = '#E11D48';

export const FILTER_COLORS: Record<FilterType, string> = {
  video: '#3b82f6',
  audio: '#10b981',
  text: '#f59e0b',
  file: DEFAULT_STREAM_COLOR,
};

export const FILTER_LABELS: Record<FilterType, string> = {
  video: 'Visual',
  audio: 'Audio',
  text: 'Text',
  file: 'File',
};

export const BADGE_CLASSES: Record<FilterType, string> = {
  video: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
  audio: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  text: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
  file: 'bg-rose-900/40 text-rose-300 border-rose-700/50',
};

export const STREAM_TYPE_SHORT_LABEL: Partial<Record<GpacStreamType, string>> =
  {
    [GpacStreamType.Visual]: 'V',
    [GpacStreamType.Audio]: 'A',
    [GpacStreamType.Text]: 'T',
    [GpacStreamType.Metadata]: 'M',
    [GpacStreamType.File]: 'F',
  };

const STREAM_TYPE_TO_FILTER: Partial<Record<GpacStreamType, FilterType>> = {
  [GpacStreamType.Visual]: 'video',
  [GpacStreamType.Audio]: 'audio',
  [GpacStreamType.Text]: 'text',
  [GpacStreamType.File]: 'file',
};

const toFilterType = (type: FilterType | GpacStreamType): FilterType =>
  (type in FILTER_COLORS
    ? (type as FilterType)
    : STREAM_TYPE_TO_FILTER[type as GpacStreamType]) ?? 'file';

export const getFilterColor = (type: FilterType | GpacStreamType): string =>
  FILTER_COLORS[toFilterType(type)];

export const getStreamTypeBadgeConfig = (
  type: GpacStreamType,
): { label: string; className: string } => ({
  label: STREAM_TYPE_SHORT_LABEL[type] ?? type?.[0]?.toUpperCase() ?? '?',
  className: BADGE_CLASSES[toFilterType(type)],
});

const determineFilterType = (filter: GraphFilterData): FilterType => {
  const pids =
    filter.opid && Object.keys(filter.opid).length > 0
      ? Object.values(filter.opid)
      : Object.values(filter.ipid ?? {});
  for (const pid of pids) {
    const mapped = STREAM_TYPE_TO_FILTER[pid.stream_type];
    if (mapped) return mapped;
  }
  return 'file';
};

export { determineFilterType };

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
      streamTypeColor: DEFAULT_STREAM_COLOR,
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
