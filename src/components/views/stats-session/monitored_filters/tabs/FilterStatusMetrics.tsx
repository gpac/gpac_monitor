import { useState } from 'react';
import type {
  StatusGroups,
  ProgressBar,
  NumericMetric,
  TextMetric,
  StateBadge,
  ArrayGroup,
} from '../utils/statusViewModel';
import { Progress } from '@/components/ui/progress';

interface FilterStatusMetricsProps {
  groups: StatusGroups;
}

const BADGE_STYLE: Record<string, string> = {
  wait: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  done: 'border-monitor-line bg-white/5 text-monitor-text-muted',
  running: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
};
const BADGE_DEFAULT =
  'border-monitor-line bg-white/5 text-monitor-text-primary';

function StatusInfo({ info }: { info?: string }) {
  if (!info) return null;
  return <p className="text-[11px] italic text-monitor-text-muted">{info}</p>;
}

function TextMetrics({ metrics }: { metrics: TextMetric[] }) {
  if (metrics.length === 0) return null;
  return (
    <div className="space-y-0.5">
      {metrics.map((metric) => (
        <div key={metric.key} className="flex gap-2 text-[11px]">
          <span className="text-monitor-text-muted">{metric.key}</span>
          <span className="italic text-monitor-text-muted">{metric.value}</span>
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
          <span className="text-monitor-text-muted truncate">{metric.key}</span>
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
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-monitor-text-muted">{bar.key}</span>
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
        className="flex items-center gap-1 text-xs text-monitor-text-muted hover:text-monitor-text-primary"
      >
        {array.name}
        <span className="text-[10px]">{open ? ' ˅' : ' ›'}</span>
      </button>
      {open && (
        <table className="mt-1 w-full text-[10px]">
          <tbody className="divide-y divide-monitor-line">
            {array.items.map((item) =>
              item.progress !== undefined ? (
                <tr key={item.name}>
                  <td className="py-0.5 pr-2 w-8 text-monitor-text-muted">
                    {item.name}
                  </td>
                  <td className="py-0.5">
                    <Progress value={item.progress} className="h-1" />
                  </td>
                  <td className="py-0.5 pl-2 w-8 text-right font-mono tabular-nums text-monitor-text-primary">
                    {item.progress}%
                  </td>
                </tr>
              ) : (
                <tr key={item.name}>
                  <td className="py-0.5 pr-2 w-8 text-monitor-text-muted">
                    {item.name}
                  </td>
                  <td
                    className="py-0.5 font-mono text-monitor-text-primary"
                    colSpan={2}
                  >
                    {item.rawText || '—'}
                  </td>
                </tr>
              ),
            )}
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
        <ArraySection key={array.name} array={array} />
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
