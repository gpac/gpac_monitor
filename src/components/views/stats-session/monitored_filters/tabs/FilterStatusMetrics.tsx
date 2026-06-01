import { useState } from 'react';
import type {
  FilterStatusViewModel,
  ProgressBar,
  StateBadge,
  ArrayGroup,
} from '../utils/statusViewModel';
import { TableSection, MetricRow } from './pid/shared';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getStreamTypeBadgeConfig } from '@/utils/filters/streamType';
import { GpacStreamType } from '@/types/domain/gpac';
import { TAB_STYLES } from './styles';
import { formatPercent } from '@/utils/formatting';

const SHORT_TO_STREAM: Partial<Record<string, GpacStreamType>> = {
  V: GpacStreamType.Visual,
  A: GpacStreamType.Audio,
  T: GpacStreamType.Text,
  M: GpacStreamType.Metadata,
};

const STATE_BADGE: Record<string, string> = {
  done: 'border-slate-400/20 bg-slate-400/10 text-slate-300',
  stopped: 'border-slate-400/20 bg-slate-400/10 text-slate-300',
  wait: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  stalled: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  error: 'border-red-400/30 bg-red-400/10 text-red-300',
  _default: 'border-monitor-line bg-white/5 text-monitor-text-primary',
};

function StreamTypeBadge({ label }: { label: string }) {
  const streamType = SHORT_TO_STREAM[label.toUpperCase()];
  if (!streamType) return null;
  const cfg = getStreamTypeBadgeConfig(streamType);
  return (
    <Badge
      variant="outline"
      className={`${TAB_STYLES.BADGE_TINY} ${cfg.className}`}
    >
      {cfg.label}
    </Badge>
  );
}

function StateBadgeRow({ badges }: { badges: StateBadge[] }) {
  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 px-2 py-1">
      {badges.map((badge) => {
        const streamType = SHORT_TO_STREAM[badge.label.toUpperCase()];
        if (streamType) {
          const cfg = getStreamTypeBadgeConfig(streamType);
          return (
            <Badge
              key={badge.key}
              variant="outline"
              className={`${TAB_STYLES.BADGE_TINY} ${cfg.className}`}
            >
              {cfg.label}
            </Badge>
          );
        }
        return (
          <Badge
            key={badge.key}
            variant="outline"
            className={`${TAB_STYLES.BADGE_TINY} ${STATE_BADGE[badge.styleKey] ?? STATE_BADGE._default}`}
          >
            {badge.label}
          </Badge>
        );
      })}
    </div>
  );
}

function ProgressMetric({ bar }: { bar: ProgressBar }) {
  return (
    <div className="space-y-1 px-2 py-1 max-w-48">
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
        className={`flex items-center gap-1 w-full text-left ${TAB_STYLES.TABLE_HEADER} hover:text-monitor-text-primary`}
      >
        <span>{array.label || 'Tracks'}</span>
        <span className="text-[10px] ml-1">{open ? '˅' : '›'}</span>
      </button>
      {open && (
        <table className="w-full text-[10px]">
          <tbody className="divide-y divide-monitor-line">
            {array.items.map((item) => (
              <tr key={item.name}>
                <td className="py-0.5 pr-2 align-top whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {item.type && <StreamTypeBadge label={item.type} />}
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                </td>
                <td className="py-0.5 w-full font-mono text-[9px] text-muted-foreground">
                  {item.rawText ?? (item.progress === undefined ? '—' : null)}
                  {item.progress !== undefined && (
                    <Progress value={item.progress} className="h-1 mt-0.5" />
                  )}
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

function FilterStatusMetrics({ groups }: { groups: FilterStatusViewModel }) {
  const hasInfo = groups.info != null || groups.textMetrics.length > 0;
  return (
    <section className="space-y-1 rounded-sm bg-black/20 ring-1 ring-white/5 mt-1 overflow-hidden">
      {hasInfo && (
        <TableSection title="Info">
          {groups.info && (
            <MetricRow
              label=""
              value={groups.info}
              isEven
              valueClassName="italic text-muted-foreground "
            />
          )}
          {groups.textMetrics.map((metric, index) => (
            <MetricRow
              key={metric.key}
              label={metric.key}
              value={metric.value}
              isEven={index % 2 === 0}
              valueClassName="italic text-muted-foreground truncate"
            />
          ))}
        </TableSection>
      )}
      {groups.stateBadges.length > 0 && (
        <StateBadgeRow badges={groups.stateBadges} />
      )}
      {groups.numericMetrics.length > 0 && (
        <TableSection title="Metrics">
          {groups.numericMetrics.map((metric, index) => (
            <MetricRow
              key={metric.key}
              label={metric.key}
              value={metric.value}
              isEven={index % 2 === 0}
            />
          ))}
        </TableSection>
      )}
      {groups.progress && <ProgressMetric bar={groups.progress} />}
      {groups.arrays.map((array) => (
        <ArraySection key={array.key} array={array} />
      ))}
    </section>
  );
}

export default FilterStatusMetrics;
