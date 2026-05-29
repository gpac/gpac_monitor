import { useState } from 'react';
import type {
  ParsedFilterStatus,
  StatusScalar,
  StatusNum,
  StatusStr,
  StatusArray,
} from '@/workers/filterStatusParser';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MetricRow, TableSection } from './pid/shared';

interface FilterStatusMetricsProps {
  parsedStatus: ParsedFilterStatus;
}

type DisplayKind = 'text' | 'badge' | 'progress' | 'ratio' | 'number';

function getDisplayKind(entry: StatusScalar): DisplayKind {
  if (entry.type === 'str') return 'text';
  if (entry.type === 'bool') return 'badge';
  const num = entry as StatusNum;
  if (entry.key === 'prog') return 'progress';
  if (entry.key === 'pc' || num.fraction?.den === 100) return 'progress';
  if (entry.key === 'buffer' || num.fraction) return 'ratio';
  return 'number';
}

function toPercent(entry: StatusNum): number {
  return entry.key === 'pc'
    ? Math.min(100, entry.value)
    : Math.min(100, Math.round(entry.value * 100));
}

function ProgressRow({ entry, isEven }: { entry: StatusNum; isEven: boolean }) {
  const pct = toPercent(entry);
  const displayValue = entry.fraction
    ? `${entry.fraction.num} / ${entry.fraction.den}`
    : `${pct}%`;
  const rowCls = `${isEven ? 'bg-black/10' : 'bg-black/20'} border-b border-white/5`;
  return (
    <>
      <tr className={rowCls}>
        <td className="px-2 py-1.5 text-xs text-muted-foreground">
          {entry.key}
        </td>
        <td className="px-2 py-1.5 text-xs text-right tabular-nums text-info">
          {displayValue}
        </td>
      </tr>
      <tr className={rowCls}>
        <td colSpan={2} className="px-2 pb-1.5">
          <Progress value={pct} className="h-1" />
        </td>
      </tr>
    </>
  );
}

function ArraySection({ array }: { array: StatusArray }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <tr
        className="bg-black/30 border-b border-white/5 cursor-pointer"
        onClick={() => setOpen((prev) => !prev)}
      >
        <td colSpan={2} className="px-2 py-1.5">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>tracks</span>
            <span className="text-[10px]">{open ? '˅' : '›'}</span>
          </div>
        </td>
      </tr>
      {open &&
        array.items.map((item) => {
          const progEntry = item.entries.find(
            (entry): entry is StatusNum =>
              entry.type === 'num' &&
              (entry.key === 'pc' || entry.fraction !== undefined),
          );
          if (progEntry) {
            const pct = toPercent(progEntry);
            return (
              <tr
                key={item.name}
                className="bg-black/5 border-b border-white/5"
              >
                <td className="px-2 py-1.5 text-xs text-muted-foreground align-middle">
                  {item.name}
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xs tabular-nums text-info">
                      {pct}%
                    </span>
                    <Progress value={pct} className="h-1 w-16" />
                  </div>
                </td>
              </tr>
            );
          }
          const raw = item.entries
            .map((entry) =>
              entry.type === 'bool' ? entry.key : `${entry.key}=${entry.value}`,
            )
            .join(' ');
          return (
            <MetricRow
              key={item.name}
              label={item.name}
              value={raw || '—'}
              isEven={false}
              valueClassName="text-muted-foreground"
            />
          );
        })}
    </>
  );
}

function ScalarRow({
  entry,
  isEven,
}: {
  entry: StatusScalar;
  isEven: boolean;
}) {
  const kind = getDisplayKind(entry);
  const rowCls = `${isEven ? 'bg-black/10' : 'bg-black/20'} border-b border-white/5`;

  if (kind === 'badge') {
    return (
      <tr className={rowCls}>
        <td colSpan={2} className="px-2 py-1.5">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
            {entry.key}
          </Badge>
        </td>
      </tr>
    );
  }

  if (kind === 'text') {
    const str = entry as StatusStr;
    if (str.key === 'info') {
      return (
        <tr className={rowCls}>
          <td
            colSpan={2}
            className="px-2 py-1.5 text-xs text-muted-foreground/70 italic"
          >
            {str.value}
          </td>
        </tr>
      );
    }
    return (
      <MetricRow
        label={str.key}
        value={str.value}
        isEven={isEven}
        valueClassName="text-muted-foreground"
      />
    );
  }

  if (kind === 'progress' || kind === 'ratio') {
    return <ProgressRow entry={entry as StatusNum} isEven={isEven} />;
  }

  const num = entry as StatusNum;
  const value = Number.isInteger(num.value)
    ? String(num.value)
    : num.value.toFixed(2);
  return <MetricRow label={num.key} value={value} isEven={isEven} />;
}

function FilterStatusMetrics({ parsedStatus }: FilterStatusMetricsProps) {
  if (parsedStatus.entries.length === 0) return null;

  const scalars = parsedStatus.entries.filter(
    (entry): entry is StatusScalar => entry.type !== 'array',
  );
  const arrays = parsedStatus.entries.filter(
    (entry): entry is StatusArray => entry.type === 'array',
  );

  return (
    <TableSection title="Status Metrics">
      {scalars.map((entry, i) => (
        <ScalarRow key={entry.key} entry={entry} isEven={i % 2 === 0} />
      ))}
      {arrays.map((array, i) => (
        <ArraySection key={`array-${i}`} array={array} />
      ))}
    </TableSection>
  );
}

export default FilterStatusMetrics;
