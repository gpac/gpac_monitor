import { Progress } from '@/components/ui/progress';
import { formatPercent } from '@/utils/formatting';
import { TAB_STYLES } from '../styles';
import type { ArrayGroup } from '../../utils/statusViewModel';
import { StreamTypeBadge } from './StatusStateBadges';

function StatusArraySection({ array }: { array: ArrayGroup }) {
  return (
    <div>
      <div
        className={`flex items-center gap-1 w-full text-left bg-white/5 border-b border-white/10 ${TAB_STYLES.TABLE_HEADER}`}
      >
        <span>{array.label || 'Tracks'}</span>
      </div>
      <div className="flex flex-col divide-y divide-white/5 pb-1">
        {array.items.map((item) => (
          <div
            key={item.key}
            className="grid items-center gap-x-3 px-2 py-1.5"
            style={{ gridTemplateColumns: '5rem 1fr 2.5rem 5rem' }}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5 shrink-0">
                {item.type && <StreamTypeBadge label={item.type} />}
              </div>
              <span className="text-[10px] font-mono text-muted-foreground truncate">
                {item.name}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 min-w-0">
              {item.metrics.map((metric) => (
                <span
                  key={metric.key}
                  className="text-[10px] font-mono whitespace-nowrap"
                >
                  <span className="text-muted-foreground/70">
                    {metric.key}:
                  </span>{' '}
                  <span
                    className="tabular-nums text-info"
                    title={metric.tooltip}
                  >
                    {metric.value}
                  </span>
                </span>
              ))}
            </div>
            <span className="text-[10px] font-mono tabular-nums text-info text-right">
              {item.progress !== undefined ? formatPercent(item.progress) : ''}
            </span>
            <div>
              {item.progress !== undefined && (
                <Progress
                  value={item.progress}
                  className="h-1.5"
                  color="bg-info"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StatusArraySection;
