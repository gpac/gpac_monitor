import { memo } from 'react';
import { 
  LuTriangle, 
  LuWifi, 
  LuWifiOff, 
  LuClock, 
  LuPlay, 
  LuPause,
  LuInfo,
  LuCheck
} from 'react-icons/lu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TabPIDData } from '@/types/domain/gpac/filter-stats';
import { formatBufferTime, getHealthStatusFromMetrics } from '@/utils/helper';

interface CriticalPIDStatsProps {
  pidData: TabPIDData;
}

/**
 * Component displaying critical PID statistics with priority badges and alerts
 * Shows the Top 5 critical states: disconnected, would_block, nb_pck_queued, buffer, playing/eos
 */
export const CriticalPIDStats = memo(({ pidData }: CriticalPIDStatsProps) => {
  // Calculate buffer usage percentage
  const bufferUsage = pidData.buffer_total && pidData.buffer_total > 0 ? (pidData.buffer / pidData.buffer_total) * 100 : 0;
  
  // Use new health assessment function
  const overallHealth = getHealthStatusFromMetrics(
    pidData.buffer,
    pidData.would_block || false,
    pidData.stats.disconnected || false,
    pidData.nb_pck_queued || 0
  );

  // Connection state badge
  const getConnectionBadge = () => {
    if (pidData.stats.disconnected) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <LuWifiOff className="h-3 w-3 stat-label" />
          Disconnected
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="flex items-center gap-1">
        <LuWifi className="h-3 w-3 stat-label" />
        Connected
      </Badge>
    );
  };

  // Would block state badge
  const getBlockingBadge = () => {
    if (pidData.would_block) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <LuTriangle className="h-3 w-3 stat-label" />
          Would Block
        </Badge>
      );
    }
    return null;
  };

  // Queue status badge
  const getQueueBadge = () => {
    const queuedPackets = pidData.nb_pck_queued || 0;
    if (queuedPackets > 50) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <LuClock className="h-3 w-3 stat-label" />
          Queue: {queuedPackets}
        </Badge>
      );
    }
    return null;
  };

  // Playing/EOS state badge
  const getPlaybackBadge = () => {
    if (pidData.eos) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <LuPause className="h-3 w-3 stat-label" />
          End of Stream
        </Badge>
      );
    }
    if (pidData.playing) {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          <LuPlay className="h-3 w-3" />
          Playing
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <LuPause className="h-3 w-3" />
        Paused
      </Badge>
    );
  };

  // Get icon for health status
  const getHealthIcon = (status: string) => {
    if (status === 'Critical') return LuInfo;
    if (status === 'Warning') return LuTriangle;
    return LuCheck;
  };

  const HealthIcon = getHealthIcon(overallHealth.status);

  return (
    <Card className="bg-stat border-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <HealthIcon className={`h-4 w-4 ${overallHealth.color}`} />
            Critical States
          </CardTitle>
          <Badge variant={overallHealth.variant} className={overallHealth.color}>
            {overallHealth.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Priority 1: Connection State */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground stat-label">Connection</span>
          {getConnectionBadge()}
        </div>

        {/* Priority 2: Blocking State */}
        {pidData.would_block && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground stat-label">Blocking</span>
            {getBlockingBadge()}
          </div>
        )}

        {/* Priority 3: Queue Status */}
        {(pidData.nb_pck_queued || 0) > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground stat-label">Queue</span>
            {getQueueBadge()}
          </div>
        )}

        {/* Priority 4: Buffer Status with Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground stat-label">Buffer Level</span>
            <div className="text-right">
              <div className={`text-sm font-bold ${overallHealth.color}`}>
                {formatBufferTime(pidData.buffer)}
              </div>
              <div className="text-xs text-muted-foreground">
                {bufferUsage.toFixed(1)}%
              </div>
            </div>
          </div>
          <Progress 
            value={bufferUsage} 
            className="h-3"
            style={{
              '--progress-background': overallHealth.status === 'Critical' ? '#ef4444' :
                                     overallHealth.status === 'Warning' ? '#f59e0b' : '#10b981'
            } as React.CSSProperties}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 ms</span>
            <span>{pidData.buffer_total ? formatBufferTime(pidData.buffer_total) : '0 ms'}</span>
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

        {/* Priority 5: Playback State */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground stat-label">Playback</span>
          {getPlaybackBadge()}
        </div>
      </CardContent>
    </Card>
  );
});

CriticalPIDStats.displayName = 'CriticalPIDStats';