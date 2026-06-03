import { Badge } from '@/components/ui/badge';
import { getStreamTypeBadgeConfig } from '@/utils/filters/streamType';
import { GpacStreamType } from '@/types/domain/gpac';
import { TAB_STYLES } from '../styles';
import type { StateBadge } from '../../utils/statusViewModel';

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

export function StreamTypeBadge({ label }: { label: string }) {
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

function StatusStateBadges({ badges }: { badges: StateBadge[] }) {
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

export default StatusStateBadges;
