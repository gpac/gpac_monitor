import { memo } from 'react';
import { LuMonitor, LuWifiOff, LuTriangle, LuClock, LuPlay, LuPause } from 'react-icons/lu';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TabPIDData } from '@/types/domain/gpac/filter-stats';
import { formatBytes } from '@/utils/helper';

interface CompactPIDStatsProps {
  pidData: TabPIDData;
  onClick?: () => void;
}

/**
 * Compact PID statistics component for dashboard/summary views
 * Shows only the most critical information in a condensed format
 */
export const CompactPIDStats = memo(({ pidData, onClick }: CompactPIDStatsProps) => {
  // Calculate buffer usage percentage
const bufferUsage = pidData.max_buffer && pidData.max_buffer > 0 ? (pidData.buffer / pidData.max_buffer) * 100 : 0;
  
  // Get critical alerts
  const getCriticalAlerts = () => {
    const alerts = [];
    if (pidData.stats.disconnected) alerts.push({ icon: LuWifiOff, color: 'text-red-500', label: 'Disconnected' });
    if (pidData.would_block) alerts.push({ icon: LuTriangle, color: 'text-red-500', label: 'Blocked' });
    if ((pidData.nb_pck_queued || 0) > 50) alerts.push({ icon: LuClock, color: 'text-orange-500', label: `Queue: ${pidData.nb_pck_queued}` });
    return alerts;
  };

  // Get buffer status color
  const getBufferColor = (usage: number) => {
    if (usage < 20 || usage > 80) return 'text-red-500';
    if (usage < 40 || usage > 60) return 'text-orange-500';
    return 'text-green-500';
  };

  // Get playback status
  const getPlaybackStatus = () => {
    if (pidData.eos) return { icon: LuPause, label: 'EOS', variant: 'outline' as const };
    if (pidData.playing) return { icon: LuPlay, label: 'Playing', variant: 'default' as const };
    return { icon: LuPause, label: 'Paused', variant: 'outline' as const };
  };

  const criticalAlerts = getCriticalAlerts();
  const playbackStatus = getPlaybackStatus();
  const PlayIcon = playbackStatus.icon;

  return (
    <Card 
      className={`bg-stat border-transparent transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:bg-stat/80 hover:border-border/40' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <LuMonitor className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium truncate">{pidData.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={playbackStatus.variant} className="text-xs px-1 py-0">
              <PlayIcon className="h-2 w-2 mr-1" />
              {playbackStatus.label}
            </Badge>
          </div>
        </div>

        {/* Critical Alerts Row */}
        {criticalAlerts.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            {criticalAlerts.slice(0, 2).map((alert, index) => {
              const AlertIcon = alert.icon;
              return (
                <div key={index} className="flex items-center gap-1">
                  <AlertIcon className={`h-3 w-3 ${alert.color}`} />
                  <span className={`text-xs ${alert.color}`}>{alert.label}</span>
                </div>
              );
            })}
            {criticalAlerts.length > 2 && (
              <Badge variant="destructive" className="text-xs px-1 py-0">
                +{criticalAlerts.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Buffer Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground stat-label">Buffer</span>
            <div className="flex items-center gap-2">
              <span className="text-xs">{formatBytes(pidData.buffer)}</span>
              <span className={`text-xs font-medium ${getBufferColor(bufferUsage)}`}>
                {bufferUsage.toFixed(0)}%
              </span>
            </div>
          </div>
          <Progress 
            value={bufferUsage} 
            className="h-1"
            style={{
              '--progress-background': 
                bufferUsage < 20 || bufferUsage > 80 ? '#ef4444' :
                bufferUsage < 40 || bufferUsage > 60 ? '#f59e0b' : '#10b981'
            } as React.CSSProperties}
          />
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 gap-4 mt-3 text-center">
          <div>
            <div className="text-xs font-medium">{pidData.nb_pck_queued || 0}</div>
            <div className="text-xs text-muted-foreground stat-label">Queued</div>
          </div>
          <div>
            <div className="text-xs font-medium">
              {pidData.codec || pidData.type || 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground stat-label">Type</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

CompactPIDStats.displayName = 'CompactPIDStats';