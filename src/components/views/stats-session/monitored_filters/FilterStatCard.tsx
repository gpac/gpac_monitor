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
import {
  formatBytes,
  formatTime,
  getActivityLevel,
  getActivityLabel,
  getActivityColorClass,
  getBufferProgressColor,
  calculateBufferUsage,
  formatNumber,
} from '@/utils/helper';

interface FilterStatCardProps {
  filter: GpacNodeData;
  onClick?: (idx: number) => void;
  isMonitored?: boolean;
}

const cachedUsageCalculations = new WeakMap<
  GpacNodeData,
  { bufferUsage: number; activityLevel: string }
>();

const FilterStatCard: React.FC<FilterStatCardProps> = memo(
  ({ filter, onClick, isMonitored = false }) => {

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


    const monitoredClass = isMonitored ? 'border border-red-900' : 'border-0';
    const hasBufferInfo = filter.ipid && Object.keys(filter.ipid).length > 0;
    const hasPackets = filter.pck_done && filter.pck_done > 0;
    const hasTime = filter.time && filter.time > 0;
    const bufferColor = getBufferProgressColor(bufferUsage);

    return (
      <Card
        className={`cursor-pointer bg-stat overflow-hidden transition-shadow hover:shadow-md ${monitoredClass}`}
        onClick={handleClick}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium truncate stat">
              {filter.name}
            </CardTitle>
            <div className="flex items-center gap-1 ml-2">
              {isMonitored && (
                <Badge
                  variant="outline"
                  className="flex h-5 items-center gap-1 px-1"
                >
                  <LuEye className="h-3 w-3" />
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
                className={`h-2 px-2 text-[10px] leading-none `}
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
          <CardDescription className="mt-1 flex items-center gap-1 text-xs">
            <LuActivity className="h-3 w-3" />
            <span className="truncate text-muted-foreground stat">
              {filter.status || 'No status'}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 p-3 pt-0">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-xs  mb-1">
                <span className="stat stat-label">I/O PIDs</span>
              </div>
              <p className="text-xs font-medium stat">
                {filter.nb_ipid || 0}/{filter.nb_opid || 0}
              </p>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <span className="stat stat-label">Data</span>
              </div>
              <p className="text-xs font-medium  stat">
                {formatBytes(filter.bytes_done)}
              </p>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <LuActivity className="h-3 w-3" />
                <span className="stat stat-label">Activity</span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className={`h-2 w-2 rounded-full ${getActivityColorClass(activityLevel)}`}
                />
                <span className="text-xs stat">
                  {getActivityLabel(activityLevel)}
                </span>
              </div>
            </div>
          </div>

          {hasBufferInfo && (
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-xs text-muted-foreground stat stat-label">
                  Buffer usage
                </span>
                <span className="text-xs stat">{bufferUsage}%</span>
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
              <Badge variant="outline" className="h-4 px-1.5 py-0 text-xs">
                <span className="stat-value">
                  {formatNumber(filter.pck_done)} pkt
                </span>
              </Badge>
            )}
            {hasTime && (
              <Badge variant="outline" className="h-4 px-1.5 py-0 text-xs">
                <span className="stat-value">{formatTime(filter.time)}</span>
              </Badge>
            )}
            {filter.errors && filter.errors > 0 && (
              <Badge variant="destructive" className="h-4 px-1.5 py-0 text-xs">
                <span className="stat-value">{filter.errors} err</span>
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
