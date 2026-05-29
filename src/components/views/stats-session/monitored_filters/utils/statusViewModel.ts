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

export type TextMetric = {
  key: string;
  value: string;
};

export type StatusGroups = {
  info?: string;
  progress?: ProgressBar;
  numericMetrics: NumericMetric[];
  textMetrics: TextMetric[];
  stateBadges: StateBadge[];
  arrays: ArrayGroup[];
};

function isProgressEntry(entry: StatusEntry): entry is StatusNum {
  if (entry.type !== 'num') return false;
  const num = entry as StatusNum;
  return (
    num.key === 'prog' ||
    num.key === 'pc' ||
    (num.fraction?.den === 100 && num.key !== 'buffer')
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
  const raw = entry.fraction
    ? `${entry.fraction.num} / ${entry.fraction.den}`
    : Number.isInteger(entry.value)
      ? String(entry.value)
      : entry.value.toFixed(2);
  const value = entry.unit ? `${raw} ${entry.unit}` : raw;
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

  const excluded = new Set<StatusEntry | undefined>([infoEntry, progressEntry]);

  const numericMetrics = entries
    .filter(
      (entry): entry is StatusNum =>
        entry.type === 'num' && !excluded.has(entry),
    )
    .map(toNumericMetric);

  const textMetrics = entries
    .filter(
      (entry): entry is StatusStr =>
        entry.type === 'str' && entry.key !== 'info' && entry.quoted,
    )
    .map((entry): TextMetric => ({ key: entry.key, value: entry.value }));

  const stateBadges = entries
    .filter(
      (entry): entry is StatusBool | StatusStr =>
        entry.type === 'bool' ||
        (entry.type === 'str' && entry.key !== 'info' && !entry.quoted),
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
    numericMetrics,
    textMetrics,
    stateBadges,
    arrays,
  };
}
