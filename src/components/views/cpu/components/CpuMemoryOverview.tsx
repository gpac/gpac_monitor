import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPercent } from '@/utils/formatting';
import { memo, useMemo } from 'react';

interface CpuMemoryOverviewProps {
  cpuUsage: number;
  memoryBytes: number;
  totalCores?: number;
  isLoading?: boolean;
}

export const CpuMemoryOverview = memo<CpuMemoryOverviewProps>(
  ({ cpuUsage = 0, memoryBytes = 0, totalCores = 0, isLoading = false }) => {
    const memoryMB = useMemo(() => memoryBytes / (1024 * 1024), [memoryBytes]);
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Card className="bg-stat border-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm stat stat-label">
              CPU
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold text-info tabular-nums">
                {isLoading ? '...' : formatPercent(cpuUsage)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stat border-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm stat stat-label">
              Memory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-xl  font-semibold text-info tabular-nums">
                {isLoading ? '...' : memoryMB.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground">MB</span>
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
              <span className="text-xl font-semibold text-info tabular-nums">
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

CpuMemoryOverview.displayName = 'CpuMemoryOverview';
