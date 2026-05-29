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

const BADGE_STYLES: Record<string, string> = {
  wait: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  done: 'border-white/10 bg-white/5 text-muted-foreground',
  running: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
};
const DEFAULT_BADGE = 'border-white/10 bg-white/5 text-muted-foreground';

function BarMetric({ bar }: { bar: ProgressBar }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{bar.key}</span>
        <span className="tabular-nums text-info">{bar.valueLabel}</span>
      </div>
      <Progress value={bar.percentage} className="h-1.5" />
    </div>
  );
}

function NumericCell({ metric }: { metric: NumericMetric }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] text-muted-foreground">{metric.key}</div>
      <div className="text-xs font-medium tabular-nums text-info">
        {metric.value}
      </div>
    </div>
  );
}

function TextMetricRow({ metric }: { metric: TextMetric }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-muted-foreground">{metric.key}</span>
      <span className="text-muted-foreground/70 italic">{metric.value}</span>
    </div>
  );
}

function StateBadgeItem({ badge }: { badge: StateBadge }) {
  const style = BADGE_STYLES[badge.styleKey] ?? DEFAULT_BADGE;
  return (
    <span
      className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium ${style}`}
    >
      {badge.label}
    </span>
  );
}

function ArraySection({ array }: { array: ArrayGroup }) {
  const [open, setOpen] = useState(array.items.length <= 4);
  return (
    <div>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        {array.name} <span className="text-[10px]">{open ? '˅' : '›'}</span>
      </button>
      {open && (
        <div className="mt-1.5 space-y-1.5">
          {array.items.map((item) =>
            item.progress !== undefined ? (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-8 shrink-0 text-[10px] text-muted-foreground">
                  {item.name}
                </span>
                <Progress value={item.progress} className="h-1 flex-1" />
                <span className="w-8 text-right text-[10px] tabular-nums text-info">
                  {item.progress}%
                </span>
              </div>
            ) : (
              <div key={item.name} className="flex gap-2 text-[10px]">
                <span className="w-8 shrink-0 text-muted-foreground">
                  {item.name}
                </span>
                <span className="font-mono text-info">
                  {item.rawText || '—'}
                </span>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function FilterStatusMetrics({ groups }: FilterStatusMetricsProps) {
  return (
    <section className="border-t border-border/60">
      <div className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Status Metrics
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)] gap-6 px-2 pb-3">
        <div className="space-y-3">
          {groups.info && (
            <p className="text-xs italic text-muted-foreground/70">
              {groups.info}
            </p>
          )}
          {groups.textMetrics.length > 0 && (
            <div className="space-y-1">
              {groups.textMetrics.map((metric) => (
                <TextMetricRow key={metric.key} metric={metric} />
              ))}
            </div>
          )}
          {groups.progress && <BarMetric bar={groups.progress} />}
        </div>
        <div className="space-y-3">
          {groups.numericMetrics.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {groups.numericMetrics.map((metric) => (
                <NumericCell key={metric.key} metric={metric} />
              ))}
            </div>
          )}
          {groups.stateBadges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {groups.stateBadges.map((badge) => (
                <StateBadgeItem key={badge.key} badge={badge} />
              ))}
            </div>
          )}
          {groups.arrays.map((array) => (
            <ArraySection key={array.name} array={array} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FilterStatusMetrics;
