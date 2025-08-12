import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TabPIDData } from '@/types/domain/gpac/filter-stats';
import { formatBytes } from '@/utils/helper';

// Import the new specialized components
import { CriticalPIDStats } from './CriticalPIDStats';
import { PerformanceMetrics } from './PerformanceMetrics';
import { MultimediaParams } from './MultimediaParams';

interface PIDStatsOverviewProps {
  pidData: TabPIDData;
  showAdvanced?: boolean;
}

/**
 * Main component that combines critical stats, performance metrics, and multimedia params
 * Provides a comprehensive overview of PID statistics with modern UI
 */
export const PIDStatsOverview = memo(
  ({ pidData, showAdvanced = true }: PIDStatsOverviewProps) => {
    // Determine status and variant based on real values
    const getStatusInfo = () => {
      if (pidData.stats.disconnected)
        return { status: 'Disconnected', variant: 'destructive' as const };
      if (pidData.would_block)
        return { status: 'Blocked', variant: 'destructive' as const };
      if (pidData.eos)
        return { status: 'End of Stream', variant: 'secondary' as const };
      if (pidData.playing)
        return { status: 'Playing', variant: 'default' as const };
      return { status: 'Idle', variant: 'outline' as const };
    };

    const statusInfo = getStatusInfo();

    // Determine PID type for display
    const getPIDType = () => {
      if (pidData.width && pidData.height) return 'Video';
      if (pidData.samplerate || pidData.channels) return 'Audio';
      if (pidData.codec) return 'Media';
      return 'Data';
    };

    return (
      <div className="space-y-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* PID Header Card */}
        <Card className="bg-stat border-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">{pidData.name}</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  {getPIDType()}
                </Badge>
              </div>
              <Badge variant={statusInfo.variant}>{statusInfo.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm font-medium">
                  {formatBytes(pidData.buffer)}
                </div>
                <div className="text-xs text-muted-foreground stat-label">
                  Buffer Used
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">
                  {pidData.buffer_total && pidData.buffer_total > 0
                    ? `${((pidData.buffer / pidData.buffer_total) * 100).toFixed(1)}%`
                    : '0%'}
                </div>
                <div className="text-xs text-muted-foreground stat-label">
                  Usage
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">
                  {pidData.nb_pck_queued || 0}
                </div>
                <div className="text-xs text-muted-foreground stat-label">
                  Queued
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Critical States - Always shown */}
        <CriticalPIDStats pidData={pidData} />

        {/* Advanced Sections - Conditionally shown */}
        {showAdvanced && (
          <>
            {/* Performance Metrics - Show if we have performance data */}
            {(pidData.stats.average_process_rate ||
              pidData.stats.average_bitrate ||
              pidData.stats.nb_processed) && (
              <PerformanceMetrics pidData={pidData} />
            )}

            {/* Multimedia Parameters - Show if we have codec/media data */}
            {(pidData.codec ||
              pidData.width ||
              pidData.samplerate ||
              pidData.type) && <MultimediaParams pidData={pidData} />}
          </>
        )}
      </div>
    );
  },
);

PIDStatsOverview.displayName = 'PIDStatsOverview';
