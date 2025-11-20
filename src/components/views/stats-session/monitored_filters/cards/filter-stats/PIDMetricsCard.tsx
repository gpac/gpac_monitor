import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilterStatsResponse } from '@/types/domain/gpac/filter-stats';

interface PIDMetricsCardProps {
  filter: FilterStatsResponse;
}

export const PIDMetricsCard = memo(({ filter }: PIDMetricsCardProps) => (
  <Card className="bg-stat border-transparent">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm">PID Metrics</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-monitor-text-secondary tabular-nums">
            {filter.nb_ipid}
          </div>
          <div className="text-xs text-muted-foreground stat-label">
            Input PIDs
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-monitor-secondary tabular-nums">
            {filter.nb_opid}
          </div>
          <div className="text-xs text-muted-foreground stat-label">
            Output PIDs
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
));

PIDMetricsCard.displayName = 'PIDMetricsCard';
