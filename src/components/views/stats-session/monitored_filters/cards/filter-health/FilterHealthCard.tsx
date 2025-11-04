import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OverviewTabData } from '@/types/domain/gpac/filter-stats';
import { formatTime } from '@/utils/formatting';
import { getFilterHealthInfo } from '../shared/statusHelpers';

interface FilterHealthCardProps {
  filter: OverviewTabData;
}

export const FilterHealthCard = memo(({ filter }: FilterHealthCardProps) => {
  const { status, type, idx, time } = filter;

  const healthInfo = useMemo(() => getFilterHealthInfo(status), [status]);
  const formattedUptime = useMemo(() => formatTime(time), [time]);

  return (
    <Card className="bg-stat border-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Filter Health</span>
          <Badge variant={healthInfo.variant} className="text-xs">
            {healthInfo.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={`rounded-lg p-3 ${healthInfo.bgColor} `}>
          <div className="flex items-center justify-between">
            <span className="text-xs  font-mediumtext-muted-foreground">
              Status
            </span>
            <span
              className={`text-xs px-2 font-cond tabular-nums ${healthInfo.color}`}
            >
              {status || 'Unknown'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground stat-label">Type</div>
            <div className="font-medium truncate">{type || 'N/A'}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground stat-label">
              Index
            </div>
            <div className="font-medium text-info tabular-nums">#{idx}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground stat-label">
              Uptime
            </div>
            <div className="font-medium text-info tabular-nums">
              {formattedUptime}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

FilterHealthCard.displayName = 'FilterHealthCard';
