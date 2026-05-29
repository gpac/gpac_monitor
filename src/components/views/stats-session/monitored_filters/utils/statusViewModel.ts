import type {
  ParsedFilterStatus,
  StatusEntry,
  StatusScalar,
  StatusNum,
  StatusStr,
  StatusBool,
  StatusArray,
} from '@/workers/filterStatusParser';

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
  progress?: number;
  rawText?: string;
};

export type ArrayGroup = {
  name: string;
  items: ArrayItem[];
};

export type StatusGroups = {
  info?: string;
  progress?: ProgressBar;
  buffer?: ProgressBar;
  numericMetrics: NumericMetric[];
  stateBadges: StateBadge[];
  arrays: ArrayGroup[];
};

function isProgressEntry(entry: StatusEntry): entry is StatusNum {
  if (entry.type !== 'num') return false;
  const num = entry as StatusNum;
  return num.key === 'prog' || num.key === 'pc' || num.fraction?.den === 100;
}

function isBufferEntry(entry: StatusEntry): entry is StatusNum {
  return (
    entry.type === 'num' &&
    (entry as StatusNum).key === 'buffer' &&
    (entry as StatusNum).fraction !== undefined
  );
}

function toProgressBar(entry: StatusNum): ProgressBar {
  let percentage: number;
  let valueLabel: string;
  if (entry.key === 'pc' || entry.fraction?.den === 100) {
    percentage = Math.min(100, entry.fraction?.num ?? entry.value);
    valueLabel = `${Math.round(percentage)}%`;
  } else {
    percentage = Math.min(100, Math.round(entry.value * 100));
    valueLabel = entry.fraction
      ? `${entry.fraction.num} / ${entry.fraction.den}`
      : `${percentage}%`;
  }
  return { key: entry.key, valueLabel, percentage };
}

function toNumericMetric(entry: StatusNum): NumericMetric {
  const value = entry.fraction
    ? `${entry.fraction.num} / ${entry.fraction.den}`
    : Number.isInteger(entry.value)
      ? String(entry.value)
      : entry.value.toFixed(2);
  return { key: entry.key, value };
}

function toStateBadge(entry: StatusBool | StatusStr): StateBadge {
  const label = entry.type === 'bool' ? entry.key : (entry as StatusStr).value;
  return { key: entry.key, label, styleKey: label.trim().toLowerCase() };
}

function toArrayItem(item: {
  name: string;
  entries: StatusScalar[];
}): ArrayItem {
  const prog = item.entries.find(isProgressEntry) as StatusNum | undefined;
  if (prog) {
    const percentage =
      prog.key === 'pc'
        ? Math.min(100, prog.value)
        : Math.min(100, Math.round(prog.value * 100));
    return { name: item.name, progress: percentage };
  }
  const rawText = item.entries
    .map((entry) =>
      entry.type === 'bool'
        ? entry.key
        : `${entry.key}=${(entry as StatusStr | StatusNum).value}`,
    )
    .join(' ');
  return { name: item.name, rawText: rawText || undefined };
}

export function buildStatusGroups(
  parsedStatus: ParsedFilterStatus,
): StatusGroups {
  const { entries } = parsedStatus;

  const infoEntry = entries.find(
    (entry): entry is StatusStr => entry.type === 'str' && entry.key === 'info',
  );
  const progressEntry = entries.find(isProgressEntry);
  const bufferEntry = entries.find(isBufferEntry);

  const excluded = new Set<StatusEntry | undefined>([
    infoEntry,
    progressEntry,
    bufferEntry,
  ]);

  const numericMetrics = entries
    .filter(
      (entry): entry is StatusNum =>
        entry.type === 'num' && !excluded.has(entry),
    )
    .map(toNumericMetric);

  const stateBadges = entries
    .filter(
      (entry): entry is StatusBool | StatusStr =>
        entry.type === 'bool' ||
        (entry.type === 'str' && (entry as StatusStr).key !== 'info'),
    )
    .map(toStateBadge);

  const arrays = entries
    .filter((entry): entry is StatusArray => entry.type === 'array')
    .map(
      (array): ArrayGroup => ({
        name: 'entries',
        items: array.items.map(toArrayItem),
      }),
    );

  return {
    info: infoEntry?.value,
    progress: progressEntry ? toProgressBar(progressEntry) : undefined,
    buffer: bufferEntry ? toProgressBar(bufferEntry) : undefined,
    numericMetrics,
    stateBadges,
    arrays,
  };
}
