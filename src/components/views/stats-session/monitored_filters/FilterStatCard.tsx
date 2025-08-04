import { useCallback, useMemo, memo } from 'react';
import { LuActivity, LuCpu, LuDatabase, LuEye } from 'react-icons/lu';
import { GpacNodeData } from '@/types/domain/gpac/model';
import { Badge } from '@/components/ui/badge';
import { 
  determineFilterSessionType, 
  FilterSessionType 
} from '@/components/views/graph/utils/filterType';
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
    
    const getSessionTypeVariant = (type: FilterSessionType) => {
      switch (type) {
        case 'source':
          return 'outline' as const;
        case 'sink':
          return 'outline' as const;
        case 'filter':
          return 'secondary' as const;
      }
    };

    const getSessionTypeColor = (type: FilterSessionType) => {
      switch (type) {
        case 'source':
          return 'text-green-600 border-green-500';
        case 'sink':
          return 'text-red-600 border-red-500';
        case 'filter':
          return 'text-blue-600 border-blue-500';
      }
    };

    const handleClick = useCallback(() => {
      if (onClick && filter.idx !== undefined) {
        onClick(filter.idx);
      }
    }, [filter.idx, onClick]);

    const monitoredClass = isMonitored ? 'border border-primary/50' : 'border';
    const hasBufferInfo = filter.ipid && Object.keys(filter.ipid).length > 0;
    const hasPackets = filter.pck_done && filter.pck_done > 0;
    const hasTime = filter.time && filter.time > 0;
    const bufferColor = getBufferProgressColor(bufferUsage);

    return (
      <Card
        className={`cursor-pointer bg-black/50 overflow-hidden transition-shadow hover:shadow-md ${monitoredClass}`}
        onClick={handleClick}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium truncate">
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
                variant={getSessionTypeVariant(sessionType)} 
                className={`h-5 px-1.5 text-xs ${getSessionTypeColor(sessionType)}`}
              >
                {sessionType.toUpperCase()}
              </Badge>
            </div>
          </div>
          <CardDescription className="mt-1 flex items-center gap-1 text-xs">
            <LuActivity className="h-3 w-3" />
            <span className="truncate text-muted-foreground">
              {filter.status || 'No status'}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 p-3 pt-0">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <LuCpu className="h-3 w-3" />
                <span>I/O PIDs</span>
              </div>
              <p className="text-xs font-medium">
                {filter.nb_ipid || 0}/{filter.nb_opid || 0}
              </p>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <LuDatabase className="h-3 w-3" />
                <span>Data</span>
              </div>
              <p className="text-xs font-medium">
                {formatBytes(filter.bytes_done)}
              </p>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <LuActivity className="h-3 w-3" />
                <span>Activity</span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className={`h-2 w-2 rounded-full ${getActivityColorClass(activityLevel)}`}
                />
                <span className="text-xs">
                  {getActivityLabel(activityLevel)}
                </span>
              </div>
            </div>
          </div>

          {hasBufferInfo && (
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-xs text-muted-foreground">
                  Buffer usage
                </span>
                <span className="text-xs">{bufferUsage}%</span>
              </div>
              <Progress
                value={bufferUsage}
                className="h-1.5"
                color={bufferColor}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-1 text-xs">
            {hasPackets && (
              <Badge variant="outline" className="h-4 px-1.5 py-0 text-xs">
                {formatNumber(filter.pck_done)} pkt
              </Badge>
            )}
            {hasTime && (
              <Badge variant="outline" className="h-4 px-1.5 py-0 text-xs">
                {formatTime(filter.time)}
              </Badge>
            )}
            {filter.errors && filter.errors > 0 && (
              <Badge variant="destructive" className="h-4 px-1.5 py-0 text-xs">
                {filter.errors} err
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
