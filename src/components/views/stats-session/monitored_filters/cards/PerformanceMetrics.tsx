import { memo } from 'react';
import { LuActivity } from 'react-icons/lu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { TabPIDData } from '@/types/domain/gpac/filter-stats';
import { formatTime, formatNumber, formatBitrate, formatPacketRate } from '@/utils/helper';

interface PerformanceMetricsProps {
  pidData: TabPIDData;
}

/**
 * Component displaying performance metrics for PID monitoring
 * Shows rates, bitrates, processing stats, and throughput indicators
 */
export const PerformanceMetrics = memo(({ pidData }: PerformanceMetricsProps) => {
  return (
    <Card className="bg-stat border-transparent">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-sm">
          <LuActivity className="h-4 w-4" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Primary Throughput Metrics - Hero Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide stat-label border-b border-border/50 pb-2">
            Throughput Performance
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Data Rate Card */}
            <div className="bg-background/20 rounded-lg p-4 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium stat-label">Data Rate</span>
                <span className="text-xs stat-label opacity-75">Average</span>
              </div>
              
              <div className="stat text-2xl font-bold leading-none">
                {formatBitrate(pidData.stats.average_bitrate)}
              </div>
              
              <div className="flex items-center justify-between pt-1 border-t border-border/30">
                <span className="text-xs stat-label opacity-60">Peak</span>
                <span className="text-sm font-semibold stat">
                  {formatBitrate(pidData.stats.max_bitrate)}
                </span>
              </div>
            </div>

            {/* Packet Rate Card */}
            <div className="bg-background/20 rounded-lg p-4 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium stat-label">Packet Rate</span>
                <span className="text-xs stat-label opacity-75">Average</span>
              </div>
              
              <div className="stat text-2xl font-bold leading-none">
                {formatPacketRate(pidData.stats.average_process_rate)}
              </div>
              
              <div className="flex items-center justify-between pt-1 border-t border-border/30">
                <span className="text-xs stat-label opacity-60">Peak</span>
                <span className="text-sm font-semibold stat">
                  {formatPacketRate(pidData.stats.max_process_rate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Processing Statistics - Secondary Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide stat-label border-b border-border/50 pb-2">
            Processing Statistics
          </h3>
          
          <div className="bg-background/10 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm stat-label">Total Processed</span>
                <span className="text-lg font-bold stat">
                  {formatNumber(pidData.stats.nb_processed || 0)}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-t border-border/20">
                <span className="text-sm stat-label">Total Processing Time</span>
                <span className="text-lg font-bold stat">
                  {formatTime(pidData.stats.total_process_time)}
                </span>
              </div>
              
              {pidData.stats.nb_processed && pidData.stats.total_process_time && pidData.stats.nb_processed > 0 && (
                <div className="flex items-center justify-between py-2 border-t border-border/20">
                  <span className="text-sm stat-label">Average per Item</span>
                  <span className="text-lg font-bold stat">
                    {formatTime(pidData.stats.total_process_time / pidData.stats.nb_processed)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

PerformanceMetrics.displayName = 'PerformanceMetrics';