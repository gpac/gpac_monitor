import { memo } from 'react';
import { LuActivity, LuTrendingUp, LuClock, LuArmchair } from 'react-icons/lu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TabPIDData } from '@/types/domain/gpac/filter-stats';
import { formatTime, formatNumber } from '@/utils/helper';

interface PerformanceMetricsProps {
  pidData: TabPIDData;
}

/**
 * Component displaying performance metrics for PID monitoring
 * Shows rates, bitrates, processing stats, and throughput indicators
 */
export const PerformanceMetrics = memo(({ pidData }: PerformanceMetricsProps) => {
  // Format bitrate values
  const formatBitrate = (bitrate: number | undefined) => {
    if (!bitrate) return '0 b/s';
    if (bitrate >= 1000000000) return `${(bitrate / 1000000000).toFixed(2)} Gb/s`;
    if (bitrate >= 1000000) return `${(bitrate / 1000000).toFixed(2)} Mb/s`;
    if (bitrate >= 1000) return `${(bitrate / 1000).toFixed(2)} Kb/s`;
    return `${bitrate} b/s`;
  };

  // Format process rate
  const formatProcessRate = (rate: number | undefined) => {
    if (!rate) return '0 Hz';
    if (rate >= 1000) return `${(rate / 1000).toFixed(2)} kHz`;
    return `${rate.toFixed(2)} Hz`;
  };

  // Calculate efficiency metrics
  const efficiency = {
    avgEfficiency: pidData.stats.average_process_rate && pidData.stats.max_process_rate 
      ? (pidData.stats.average_process_rate / pidData.stats.max_process_rate) * 100 
      : 0,
    bitrateEfficiency: pidData.stats.average_bitrate && pidData.stats.max_bitrate 
      ? (pidData.stats.average_bitrate / pidData.stats.max_bitrate) * 100 
      : 0
  };

  // Get performance badge variant based on efficiency
  const getPerformanceBadge = (efficiency: number) => {
    if (efficiency >= 80) return { variant: 'default' as const, color: 'bg-green-600' };
    if (efficiency >= 60) return { variant: 'secondary' as const, color: 'bg-yellow-600' };
    return { variant: 'destructive' as const, color: 'bg-red-600' };
  };

  return (
    <Card className="bg-stat border-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <LuActivity className="h-4 w-4" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Processing Rates Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <LuArmchair className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Processing Rates</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground stat-label">Average</span>
                <span className="text-sm font-medium">
                  {formatProcessRate(pidData.stats.average_process_rate)}
                </span>
              </div>
              {efficiency.avgEfficiency > 0 && (
                <div className="flex justify-end">
                  <Badge 
                    {...getPerformanceBadge(efficiency.avgEfficiency)} 
                    className="text-xs px-1 py-0"
                  >
                    {efficiency.avgEfficiency.toFixed(0)}%
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground stat-label">Max</span>
                <span className="text-sm font-medium">
                  {formatProcessRate(pidData.stats.max_process_rate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bitrate Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <LuTrendingUp className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Bitrate</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground stat-label">Average</span>
                <span className="text-sm font-medium">
                  {formatBitrate(pidData.stats.average_bitrate)}
                </span>
              </div>
              {efficiency.bitrateEfficiency > 0 && (
                <div className="flex justify-end">
                  <Badge 
                    {...getPerformanceBadge(efficiency.bitrateEfficiency)} 
                    className="text-xs px-1 py-0"
                  >
                    {efficiency.bitrateEfficiency.toFixed(0)}%
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground stat-label">Max</span>
                <span className="text-sm font-medium">
                  {formatBitrate(pidData.stats.max_bitrate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Processing Statistics */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <LuClock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Processing Stats</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground stat-label">Total Processed</span>
              <span className="text-sm font-medium">
                {formatNumber(pidData.stats.nb_processed || 0)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground stat-label">Total Time</span>
              <span className="text-sm font-medium">
                {formatTime(pidData.stats.total_process_time)}
              </span>
            </div>
            
            {/* Calculate average processing time per item if we have the data */}
            {pidData.stats.nb_processed && pidData.stats.total_process_time && pidData.stats.nb_processed > 0 && (
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground stat-label">Avg per Item</span>
                <span className="text-sm font-medium">
                  {formatTime(pidData.stats.total_process_time / pidData.stats.nb_processed)}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

PerformanceMetrics.displayName = 'PerformanceMetrics';