import type {
  ParsedFilterStatus,
  StatusEntry,
  StatusScalar,
  StatusNum,
  StatusStr,
  StatusBool,
  StatusArray,
} from '@/workers/filterStatusParser';
import { formatFps, formatFractionAsTime } from '@/utils/formatting';

export type ProgressBar = {
  key: string;
  valueLabel: string;
  percentage: number;
};

export type NumericMetric = {
  key: string;
  value: string;
  tooltip?: string;
};

export type StateBadge = {
  key: string;
  label: string;
  styleKey: string;
};

export type ArrayMetric = { key: string; value: string; tooltip?: string };

export type ArrayItem = {
  name: string;
  type?: string;
  metrics: ArrayMetric[];
  progress?: number;
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
  if (entry.key === 'time' && entry.fraction) {
    const { num, den } = entry.fraction;
    return {
      key: entry.key,
      value: formatFractionAsTime(num, den),
      tooltip: `${num}/${den}`,
    };
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

function scalarValueStr(entry: StatusScalar): string {
  if (entry.type === 'bool') return '●';
  if (entry.type === 'str') return entry.value;
  const num = entry as StatusNum;
  const unit = num.unit ? ` ${num.unit}` : '';
  if (num.fraction) {
    if (entry.key === 'time')
      return formatFractionAsTime(num.fraction.num, num.fraction.den);
    return `${num.fraction.num}/${num.fraction.den}${unit}`;
  }
  return `${Number.isInteger(num.value) ? String(num.value) : num.value.toFixed(2)}${unit}`;
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
  const metrics: ArrayMetric[] = item.entries
    .filter((entry) => !excluded.has(entry))
    .map((entry) => {
      const value = scalarValueStr(entry);
      const tooltip =
        entry.type === 'num' && entry.key === 'time' && entry.fraction
          ? `${entry.fraction.num}/${entry.fraction.den}`
          : undefined;
      return { key: entry.key, value, tooltip };
    });

  if (progressEntry) {
    const percentage =
      progressEntry.key === 'pc'
        ? clampPercentage(progressEntry.value)
        : clampPercentage(progressEntry.value * 100);
    return {
      name: item.name,
      type: typeEntry?.value,
      metrics,
      progress: percentage,
    };
  }
  return { name: item.name, type: typeEntry?.value, metrics };
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
