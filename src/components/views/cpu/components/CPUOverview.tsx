import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPercent } from '@/utils/formatUtils';
import { formatBytes } from '@/utils/helper';

interface CPUOverviewProps {
  cpuUsage: number;
  memoryPercent?: number;
  totalCores?: number;
  isLoading?: boolean;
  memoryProcess?: number;
}

export const CPUOverview: React.FC<CPUOverviewProps> = ({
  cpuUsage = 0,
  memoryProcess = 0,
  totalCores = 0,
  isLoading = false,
}) => {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <Card className="bg-stat border-0">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm stat stat-label">
            CPU Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex  items-center gap-2">
            <span className="text-md font-semibold stat">
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
          <div className="flex  items-center ">
            <span className="text-md font-semibold stat">
              {isLoading ? '...' : formatBytes(memoryProcess).toString()}
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
          <div className="flex items-baseline">
            <span className="text-2xl font-semibold stat">
              {isLoading ? '...' : totalCores}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">Cores</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
