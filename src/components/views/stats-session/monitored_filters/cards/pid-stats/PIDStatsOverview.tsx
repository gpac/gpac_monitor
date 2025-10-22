import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TabPIDData } from '@/types/domain/gpac/filter-stats';
import { formatBytes } from '@/utils/formatting';
import { getPIDStatusInfo, getPIDType } from '../shared/statusHelpers';

// Import the new specialized components
import { CriticalPIDStats } from './CriticalPIDStats';
import { PerformanceMetrics } from './PerformanceMetrics';
import { MultimediaParams } from '../media-info';

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
    const statusInfo = getPIDStatusInfo(pidData);
    const pidType = getPIDType(pidData);

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
                  {pidType}
                </Badge>
              </div>
              <Badge variant={statusInfo.variant}>{statusInfo.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm font-medium text-info tabular-nums">
                  {formatBytes(pidData.buffer)}
                </div>
                <div className="text-xs text-muted-foreground stat-label">
                  Buffer Used
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-info tabular-nums">
                  {pidData.buffer_total && pidData.buffer_total > 0
                    ? `${((pidData.buffer / pidData.buffer_total) * 100).toFixed(1)}%`
                    : '0%'}
                </div>
                <div className="text-xs text-muted-foreground stat-label">
                  Usage
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-info tabular-nums">
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
