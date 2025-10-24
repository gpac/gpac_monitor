import { useCallback, useMemo, memo } from 'react';
import { LuActivity, LuEye } from 'react-icons/lu';
import { GpacNodeData } from '@/types/domain/gpac/model';
import { Badge } from '@/components/ui/badge';
import { determineFilterSessionType } from '@/components/views/graph/utils/filterType';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatBytes, formatTime, formatNumber } from '@/utils/formatting';
import {
  getActivityLevel,
  getActivityLabel,
  getActivityColorClass,
  getBufferProgressColor,
  calculateBufferUsage,
} from '@/utils/metrics';

interface FilterStatCardProps {
  filter: GpacNodeData;
  onClick?: (idx: number) => void;
  isMonitored?: boolean;
  isDetached?: boolean;
}

const cachedUsageCalculations = new WeakMap<
  GpacNodeData,
  { bufferUsage: number; activityLevel: string }
>();

const FilterStatCard: React.FC<FilterStatCardProps> = memo(
  ({ filter, onClick, isDetached = false }) => {
    const { bufferUsage, activityLevel } = useMemo(() => {
      if (cachedUsageCalculations.has(filter)) {
        return cachedUsageCalculations.get(filter) as {
          bufferUsage: number;
          activityLevel: string;
        };
      }

      const bufferUsage = calculateBufferUsage(filter.ipid);

      const activityLevel = getActivityLevel(
        filter.pck_done,
        filter.bytes_done,
      );

      const result = { bufferUsage, activityLevel };
      cachedUsageCalculations.set(filter, result);
      return result;
    }, [filter]);

    const sessionType = determineFilterSessionType(filter);

    const handleClick = useCallback(() => {
      if (onClick && filter.idx !== undefined) {
        onClick(filter.idx);
      }
    }, [filter.idx, onClick]);

    // Detached = monitored. Ring + cursor disabled
    const ringClass = isDetached
      ? 'ring-2 ring-red-700/90'
      : 'ring-1 ring-transparent hover:ring-monitor-accent/40';

    const cursorClass = isDetached
      ? 'cursor-not-allowed opacity-60'
      : 'cursor-pointer hover:bg-white/4';

    const hasBufferInfo = filter.ipid && Object.keys(filter.ipid).length > 0;
    const hasPackets = filter.pck_done && filter.pck_done > 0;
    const hasTime = filter.time && filter.time > 0;
    const bufferColor = getBufferProgressColor(bufferUsage);

    return (
      <Card
        className={`bg-stat overflow-hidden transition-colors bg-monitor-panel border-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400/30 ${ringClass} ${cursorClass}`}
        onClick={handleClick}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium truncate tracking-tight text-monitor-text-primary">
              {filter.name}
            </CardTitle>
            <div className="flex items-center gap-1 ml-2">
              {isDetached && (
                <Badge
                  variant="outline"
                  className="flex h-5 items-center gap-1 px-1 ring-1 ring-red-600/90 text-slate-900/90 bg-red-200"
                  title="Filter is monitored (detached view)"
                >
                  <LuEye className="h-4 w-4" />
                </Badge>
              )}
              <Badge
                variant={
                  sessionType === 'source'
                    ? 'outline'
                    : sessionType === 'sink'
                      ? 'outline'
                      : 'secondary'
                }
                className={`h-2 px-2 text-[10px] leading-none capitalize ring-1 ring-monitor-line bg-white/5 text-monitor-text-secondary`}
                style={{
                  minHeight: '16px',
                  paddingTop: '0',
                  paddingBottom: '0',
                }}
              >
                <span className="">{sessionType}</span>
              </Badge>
            </div>
          </div>
          <CardDescription className="mt-1 flex items-center gap-1 text-xs text-monitor-text-muted">
            <LuActivity className="h-3 w-3" />
            <span className="truncate">{filter.status || 'No status'}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 p-3 pt-0">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-xs mb-1 text-monitor-text-muted">
                <span>I/O PIDs</span>
              </div>
              <p className="text-xs font-medium tabular-nums text-monitor-text-secondary">
                {filter.nb_ipid || 0}/{filter.nb_opid || 0}
              </p>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-xs text-monitor-text-muted mb-1">
                <span className="stat stat-label">Data</span>
              </div>
              <p className="text-xs font-medium tabular-nums text-monitor-text-secondary">
                {formatBytes(filter.bytes_done)}
              </p>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-xs text-monitor-text-muted mb-1">
                <LuActivity className="h-3 w-3" />
                <span className="stat stat-label">Activity</span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className={`h-2 w-2 rounded-full ${getActivityColorClass(activityLevel)}`}
                />
                <span className="text-xs text-monitor-text-secondary">
                  {getActivityLabel(activityLevel)}
                </span>
              </div>
            </div>
          </div>

          {hasBufferInfo && (
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-xs text-monitor-text-muted">
                  Buffer usage
                </span>
                <span className="text-xs tabular-nums text-monitor-text-secondary">
                  {bufferUsage}%
                </span>
              </div>
              <Progress
                value={bufferUsage}
                className="h-1.5"
                color={bufferColor}
              />
            </div>
          )}

          <div className="flex justify-between items-center gap-1 text-xs">
            {hasPackets && (
              <Badge
                variant="outline"
                className="h-4 px-1.5 py-0 text-xs ring-1 ring-monitor-line bg-white/5 text-monitor-text-secondary"
              >
                {formatNumber(filter.pck_done)} pkt
              </Badge>
            )}
            {hasTime && (
              <Badge variant="outline" className="h-4 px-1.5 py-0 text-xs">
                <span className="stat-value">{formatTime(filter.time)}</span>
              </Badge>
            )}
            {filter.errors && filter.errors > 0 && (
              <Badge variant="destructive" className="h-4 px-1.5 py-0 text-xs">
                <span className="tabular-nums">{filter.errors} err</span>
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  },
);

FilterStatCard.displayName = 'FilterStatCard';

export default FilterStatCard;
