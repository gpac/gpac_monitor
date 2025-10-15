import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPercent } from '@/utils/formatUtils';
import { memo } from 'react';

interface CPUOverviewProps {
  cpuUsage: number;
  memoryPercent?: number;
  totalCores?: number;
  isLoading?: boolean;
  memoryProcess?: number;
}

export const CPUOverview = memo<CPUOverviewProps>(
  ({ cpuUsage = 0, totalCores = 0, isLoading = false }) => {
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Card className="bg-stat border-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm stat stat-label">
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-info tabular-nums">
                {isLoading ? '...' : formatPercent(cpuUsage)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stat border-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm stat stat-label">
              System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-info tabular-nums">
                {isLoading ? '...' : totalCores}
              </span>
              <span className="text-xs text-muted-foreground">Cores</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  },
);
