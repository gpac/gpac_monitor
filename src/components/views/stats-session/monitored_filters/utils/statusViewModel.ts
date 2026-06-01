import type {
  ParsedFilterStatus,
  StatusEntry,
  StatusScalar,
  StatusNum,
  StatusStr,
  StatusBool,
  StatusArray,
} from '@/workers/filterStatusParser';
import { formatFps } from '@/utils/formatting';

export type ProgressBar = {
  key: string;
  valueLabel: string;
  percentage: number;
};

export type NumericMetric = {
  key: string;
  value: string;
};

export type StateBadge = {
  key: string;
  label: string;
  styleKey: string;
};

export type ArrayItem = {
  name: string;
  type?: string;
  progress?: number;
  rawText?: string;
};

export type ArrayGroup = {
  key: string;
  label: string;
  items: ArrayItem[];
};

export type TextMetric = {
  key: string;
  value: string;
};

export type FilterStatusViewModel = {
  info?: string;
  progress?: ProgressBar;
  numericMetrics: NumericMetric[];
  textMetrics: TextMetric[];
  stateBadges: StateBadge[];
  arrays: ArrayGroup[];
};

export type StatusGroups = FilterStatusViewModel;

const PROGRESS_METRIC_KEYS = new Set(['prog', 'pc']);

function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function isInfoEntry(entry: StatusEntry): entry is StatusStr {
  return entry.type === 'str' && entry.key === 'info';
}

function isProgressEntry(entry: StatusEntry): entry is StatusNum {
  return entry.type === 'num' && PROGRESS_METRIC_KEYS.has(entry.key);
}

function isTextMetricEntry(entry: StatusEntry): entry is StatusStr {
  return entry.type === 'str' && entry.key !== 'info' && entry.quoted;
}

function isStateBadgeEntry(
  entry: StatusEntry,
): entry is StatusBool | StatusStr {
  return (
    entry.type === 'bool' ||
    (entry.type === 'str' && entry.key !== 'info' && !entry.quoted)
  );
}

function normalizeStyleKey(value: string): string {
  return value.trim().toLowerCase();
}

function formatNumericValue(entry: StatusNum): string {
  if (entry.fraction) {
    return `${entry.fraction.num} / ${entry.fraction.den}`;
  }
  return Number.isInteger(entry.value)
    ? String(entry.value)
    : entry.value.toFixed(2);
}

function formatScalarCompact(entry: StatusScalar): string {
  if (entry.type === 'bool') return entry.key;
  if (entry.type === 'str') return `${entry.key}=${entry.value}`;
  const numericEntry = entry as StatusNum;
  const formattedValue = numericEntry.fraction
    ? `${numericEntry.fraction.num}/${numericEntry.fraction.den}`
    : Number.isInteger(numericEntry.value)
      ? String(numericEntry.value)
      : numericEntry.value.toFixed(2);
  return `${numericEntry.key}=${formattedValue}`;
}

function toProgressBar(entry: StatusNum): ProgressBar {
  const rawPercentage = entry.key === 'pc' ? entry.value : entry.value * 100;

  const percentage = clampPercentage(rawPercentage);
  const valueLabel = entry.fraction
    ? `${entry.fraction.num} / ${entry.fraction.den}`
    : `${Math.round(percentage)}%`;

  return { key: entry.key, valueLabel, percentage };
}

function toNumericMetric(entry: StatusNum): NumericMetric {
  if (entry.key === 'fps' || entry.unit === 'fps') {
    return { key: entry.key, value: formatFps(entry.value) };
  }
  const formattedValue = formatNumericValue(entry);
  return {
    key: entry.key,
    value: entry.unit ? `${formattedValue} ${entry.unit}` : formattedValue,
  };
}

function toStateBadge(entry: StatusBool | StatusStr): StateBadge {
  const label = entry.type === 'bool' ? entry.key : (entry as StatusStr).value;
  return { key: entry.key, label, styleKey: normalizeStyleKey(label) };
}

function toArrayItem(item: {
  name: string;
  entries: StatusScalar[];
}): ArrayItem {
  const typeEntry = item.entries.find(
    (entry): entry is StatusStr => entry.type === 'str' && entry.key === 'type',
  );
  const progressEntry = item.entries.find(isProgressEntry) as
    | StatusNum
    | undefined;
  const excluded = new Set<StatusScalar>(
    [typeEntry, progressEntry].filter(Boolean) as StatusScalar[],
  );
  const remaining = item.entries.filter((entry) => !excluded.has(entry));
  const rawText =
    remaining.length > 0
      ? remaining.map(formatScalarCompact).join(' ')
      : undefined;

  if (progressEntry) {
    const percentage =
      progressEntry.key === 'pc'
        ? clampPercentage(progressEntry.value)
        : clampPercentage(progressEntry.value * 100);
    return {
      name: item.name,
      type: typeEntry?.value,
      progress: percentage,
      rawText,
    };
  }
  return { name: item.name, type: typeEntry?.value, rawText };
}

export function buildFilterStatusViewModel(
  parsedStatus: ParsedFilterStatus,
): FilterStatusViewModel {
  const { entries } = parsedStatus;

  const infoEntry = entries.find(isInfoEntry);
  const progressEntry = entries.find(isProgressEntry);
  const excludedEntries = new Set<StatusEntry>(
    [infoEntry, progressEntry].filter(Boolean) as StatusEntry[],
  );

  const numericMetrics = entries
    .filter(
      (entry): entry is StatusNum =>
        entry.type === 'num' && !excludedEntries.has(entry),
    )
    .map(toNumericMetric);

  const textMetrics = entries
    .filter(isTextMetricEntry)
    .map((entry): TextMetric => ({ key: entry.key, value: entry.value }));

  const stateBadges = entries.filter(isStateBadgeEntry).map(toStateBadge);

  const arrayGroups = entries
    .filter((entry): entry is StatusArray => entry.type === 'array')
    .map(
      (array, index): ArrayGroup => ({
        key: `status-array-${index}`,
        label: '',
        items: array.items.map(toArrayItem),
      }),
    );

  return {
    info: infoEntry?.value,
    progress: progressEntry ? toProgressBar(progressEntry) : undefined,
    numericMetrics,
    textMetrics,
    stateBadges,
    arrays: arrayGroups,
  };
}
