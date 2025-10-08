import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OverviewTabData } from '@/types/domain/gpac/filter-stats';
import { formatTime } from '@/utils/helper';

interface FilterHealthCardProps {
  filter: OverviewTabData;
}

type HealthVariant = 'default' | 'secondary' | 'destructive';

interface HealthInfo {
  variant: HealthVariant;
  color: string;
  bgColor: string;
  label: string;
}

const getFilterHealthInfo = (status: string): HealthInfo => {
  const statusLower = status?.toLowerCase() || '';

  if (statusLower.includes('error') || statusLower.includes('stop')) {
    return {
      variant: 'destructive',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      label: 'Critical',
    };
  }
  if (
    statusLower.includes('warning') ||
    statusLower.includes('wait') ||
    statusLower.includes('block')
  ) {
    return {
      variant: 'secondary',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      label: 'Warning',
    };
  }
  return {
    variant: 'default',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    label: 'Healthy',
  };
};

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
        <div
          className={`rounded-lg p-3 ${healthInfo.bgColor} border border-border/50`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Status
            </span>
            <span className={`text-sm font-semibold ${healthInfo.color}`}>
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
            <div className="font-medium">#{idx}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground stat-label">
              Uptime
            </div>
            <div className="font-medium">{formattedUptime}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

FilterHealthCard.displayName = 'FilterHealthCard';
