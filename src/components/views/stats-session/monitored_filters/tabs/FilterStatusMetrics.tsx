import { useState } from 'react';
import type {
  FilterStatusViewModel,
  ProgressBar,
  NumericMetric,
  TextMetric,
  StateBadge,
  ArrayGroup,
} from '../utils/statusViewModel';
import { Progress } from '@/components/ui/progress';
import { formatPercent } from '@/utils/formatting';

interface FilterStatusMetricsProps {
  groups: FilterStatusViewModel;
}

const BADGE_STYLE: Record<string, string> = {
  done: 'border-slate-400/20  bg-slate-400/10  text-slate-300',
  stopped: 'border-slate-400/20  bg-slate-400/10  text-slate-300',
  wait: 'border-amber-400/30  bg-amber-400/10  text-amber-300',
  stalled: 'border-amber-400/30  bg-amber-400/10  text-amber-300',
  error: 'border-red-400/30    bg-red-400/10    text-red-300',
};
const BADGE_DEFAULT =
  'border-monitor-line bg-white/5 text-monitor-text-primary';

function StatusInfo({ info }: { info?: string }) {
  if (!info) return null;
  return <p className="text-[11px] italic text-muted-foreground">{info}</p>;
}

function TextMetrics({ metrics }: { metrics: TextMetric[] }) {
  if (metrics.length === 0) return null;
  return (
    <div className="space-y-0.5">
      {metrics.map((metric) => (
        <div key={metric.key} className="flex gap-2 text-[11px]">
          <span className="text-muted-foreground">{metric.key}</span>
          <span className="italic text-muted-foreground">{metric.value}</span>
        </div>
      ))}
    </div>
  );
}

function StatusBadgeRow({ badges }: { badges: StateBadge[] }) {
  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((badge) => (
        <span
          key={badge.key}
          className={`rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${BADGE_STYLE[badge.styleKey] ?? BADGE_DEFAULT}`}
          title={badge.key !== badge.label ? badge.key : undefined}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}

function MetricGrid({ numerics }: { numerics: NumericMetric[] }) {
  if (numerics.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
      {numerics.map((metric) => (
        <div key={metric.key} className="flex justify-between gap-1 text-xs">
          <span className="text-muted-foreground truncate">{metric.key}</span>
          <span className="font-mono tabular-nums slashed-zero text-monitor-text-primary shrink-0">
            {metric.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProgressMetric({ bar }: { bar: ProgressBar }) {
  return (
    <div className="space-y-1 max-w-48">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{bar.key}</span>
        <span className="font-mono tabular-nums slashed-zero text-monitor-text-primary">
          {bar.valueLabel}
        </span>
      </div>
      <Progress value={bar.percentage} className="h-1.5" />
    </div>
  );
}

function ArraySection({ array }: { array: ArrayGroup }) {
  const [open, setOpen] = useState(array.items.length <= 4);
  return (
    <div>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-monitor-text-primary"
      >
        {array.label && <span>{array.label}</span>}
        <span className="text-[10px]">{open ? '˅' : '›'}</span>
      </button>
      {open && (
        <table className="mt-1 w-full text-[10px]">
          <tbody className="divide-y divide-monitor-line">
            {array.items.map((item) => (
              <tr key={item.name}>
                <td className="py-0.5 pr-2 text-muted-foreground align-top whitespace-nowrap">
                  {item.name}
                </td>
                <td className="py-0.5 w-full">
                  {item.rawText && (
                    <div className="font-mono text-[9px] text-muted-foreground mb-0.5">
                      {item.rawText}
                    </div>
                  )}
                  {item.progress !== undefined && (
                    <Progress value={item.progress} className="h-1" />
                  )}
                  {item.progress === undefined && !item.rawText && '—'}
                </td>
                <td className="py-0.5 pl-2 text-right font-mono tabular-nums text-monitor-text-primary align-top whitespace-nowrap">
                  {item.progress !== undefined
                    ? formatPercent(item.progress)
                    : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ArraySections({ arrays }: { arrays: ArrayGroup[] }) {
  if (arrays.length === 0) return null;
  return (
    <div className="space-y-2">
      {arrays.map((array) => (
        <ArraySection key={array.key} array={array} />
      ))}
    </div>
  );
}

function FilterStatusMetrics({ groups }: FilterStatusMetricsProps) {
  return (
    <section className="space-y-2 rounded-sm bg-black/20 ring-1 ring-white/5 px-2 py-2 mt-1">
      <StatusInfo info={groups.info} />
      <TextMetrics metrics={groups.textMetrics} />
      <StatusBadgeRow badges={groups.stateBadges} />
      <MetricGrid numerics={groups.numericMetrics} />
      {groups.progress && <ProgressMetric bar={groups.progress} />}
      <ArraySections arrays={groups.arrays} />
    </section>
  );
}

export default FilterStatusMetrics;
