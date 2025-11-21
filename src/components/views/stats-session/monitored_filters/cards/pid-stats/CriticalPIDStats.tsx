import { memo } from 'react';
import { LuTriangle, LuInfo, LuCheck } from 'react-icons/lu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TabPIDData } from '@/types/domain/gpac/filter-stats';
import { formatBufferTime } from '@/utils/formatting';
import { useCriticalPIDStats } from '../../../hooks/data/useCriticalPIDStats';

interface CriticalPIDStatsProps {
  pidData: TabPIDData;
}

/**
 * Component displaying critical PID statistics with priority badges and alerts
 * Shows the Top 5 critical states: disconnected, would_block, nb_pck_queued, buffer, playing/eos
 */
export const CriticalPIDStats = memo(({ pidData }: CriticalPIDStatsProps) => {
  const { bufferUsage, overallHealth, criticalStates } =
    useCriticalPIDStats(pidData);

  // Get icon for health status
  const getHealthIcon = (status: string) => {
    if (status === 'Critical') return LuInfo;
    if (status === 'Warning') return LuTriangle;
    return LuCheck;
  };

  const HealthIcon = getHealthIcon(overallHealth.status);

  return (
    <Card className="bg-monitor-panel border-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <HealthIcon className="h-4 w-4 stat-label" />
            System Health
          </CardTitle>
          <Badge variant={overallHealth.variant}>{overallHealth.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Critical States Grid */}
        <div className="grid grid-cols-1 gap-3">
          {criticalStates
            .filter((state) => state.show)
            .sort((a, b) => a.priority - b.priority)
            .map((state) => (
              <div
                key={state.key}
                className="flex items-center justify-between p-2 rounded-md bg-background/50"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-medium stat-label">
                    {state.label}
                  </span>
                  <span className="text-sm stat text-info tabular-nums">
                    {state.value}
                  </span>
                </div>
                <Badge variant={state.variant} className="shrink-0">
                  {state.status === 'critical'
                    ? 'Critical'
                    : state.status === 'warning'
                      ? 'Warning'
                      : state.status === 'info'
                        ? 'Info'
                        : 'OK'}
                </Badge>
              </div>
            ))}
        </div>

        {/* Priority 4: Buffer Status with Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground stat-label">
              Buffer Level
            </span>
            <div className="text-right">
              <div
                className={`text-sm font-bold text-info tabular-nums ${overallHealth.color}`}
              >
                {formatBufferTime(pidData.buffer)}
              </div>
              <div className="text-xs text-muted-foreground text-info tabular-nums">
                {bufferUsage.toFixed(1)}%
              </div>
            </div>
          </div>
          <Progress
            value={bufferUsage}
            className="h-3"
            style={
              {
                '--progress-background':
                  overallHealth.status === 'Critical'
                    ? '#ef4444'
                    : overallHealth.status === 'Warning'
                      ? '#f59e0b'
                      : '#10b981',
              } as React.CSSProperties
            }
          />
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>0 ms</span>
            <span>
              {pidData.buffer_total
                ? formatBufferTime(pidData.buffer_total)
                : '0 ms'}
            </span>
          </div>

          {/* Buffer health indicator */}
          {overallHealth.status === 'Critical' && (
            <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 p-1 rounded">
              <LuTriangle className="h-3 w-3" />
              <span>Buffer critically low - risk of underflow</span>
            </div>
          )}
          {overallHealth.status === 'Warning' && (
            <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 p-1 rounded">
              <LuInfo className="h-3 w-3" />
              <span>Buffer level requires monitoring</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

CriticalPIDStats.displayName = 'CriticalPIDStats';
