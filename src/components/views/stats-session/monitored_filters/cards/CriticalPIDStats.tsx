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
  
  // Determine buffer status and color
  const getBufferStatus = (usage: number) => {
    if (usage < 20) return { status: 'critical', color: 'red', variant: 'destructive' as const };
    if (usage > 80) return { status: 'warning', color: 'orange', variant: 'secondary' as const };
    return { status: 'normal', color: 'green', variant: 'default' as const };
  };

  const bufferStatus = getBufferStatus(bufferUsage);

  // Connection state badge
  const getConnectionBadge = () => {
    if (pidData.stats.disconnected) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <LuWifiOff className="h-3 w-3" />
          Disconnected
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="flex items-center gap-1">
        <LuWifi className="h-3 w-3" />
        Connected
      </Badge>
    );
  };

  // Would block state badge
  const getBlockingBadge = () => {
    if (pidData.would_block) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <LuTriangle className="h-3 w-3" />
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
          <LuClock className="h-3 w-3" />
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
          <LuPause className="h-3 w-3" />
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

  // Overall health indicator
  const getOverallHealth = () => {
    if (pidData.stats.disconnected || pidData.would_block) {
      return { icon: LuInfo, color: 'text-red-500', status: 'Critical' };
    }
    if (bufferStatus.status === 'critical' || (pidData.nb_pck_queued || 0) > 100) {
      return { icon: LuTriangle, color: 'text-orange-500', status: 'Warning' };
    }
    return { icon: LuCheck, color: 'text-green-500', status: 'Healthy' };
  };

  const health = getOverallHealth();
  const HealthIcon = health.icon;

  return (
    <Card className="bg-stat border-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <HealthIcon className={`h-4 w-4 ${health.color}`} />
            Critical States
          </CardTitle>
          <Badge variant="outline" className={health.color}>
            {health.status}
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
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground stat-label">Buffer</span>
            <Badge variant={bufferStatus.variant}>
              {bufferUsage.toFixed(1)}%
            </Badge>
          </div>
          <Progress 
            value={bufferUsage} 
            className="h-2"
            // Custom color based on status
            style={{
              '--progress-background': bufferStatus.status === 'critical' ? '#ef4444' :
                                     bufferStatus.status === 'warning' ? '#f59e0b' : '#10b981'
            } as React.CSSProperties}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{pidData.buffer.toLocaleString()} bytes</span>
            <span>{pidData.buffer_total ? pidData.buffer_total.toLocaleString() : '0'} bytes</span>
          </div>
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