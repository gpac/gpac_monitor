import type { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import React from 'react';
import {
  LuActivity,
  LuDatabase,
  LuArrowUp,
  LuArrowDown,
  LuPlay,
} from 'react-icons/lu';
import { FiltersGrid } from '../session-overview/FiltersGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ActivityIndicator,
  ActivityLevel,
} from '@/components/ui/activity-indicator';
import { formatBytes, formatNumber } from '@/utils/formatting';
import type { StatsCounters, SystemStats } from '../hooks/useStatsCalculations';

interface DashboardTabContentProps {
  systemStats: SystemStats;
  statsCounters: StatsCounters;
  filtersWithLiveStats: EnrichedFilterOverview[];
  filtersMatchingCriteria: EnrichedFilterOverview[];
  loading: boolean;
  monitoredFilters: Map<number, EnrichedFilterOverview>;
  onCardClick: (idx: number) => void;
  refreshInterval: string;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  badge?: string;
  progress?: number;
  activityLevel?: ActivityLevel;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  badge,
  progress,
  activityLevel,
  className = '',
}) => {
  const getTrendIcon = () => {
    if (trend === 'up')
      return <LuArrowUp className="h-3 w-3 text-emerald-400" />;
    if (trend === 'down')
      return <LuArrowDown className="h-3 w-3 text-rose-400" />;
    return null;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-emerald-400';
    if (trend === 'down') return 'text-rose-400';
    return 'text-monitor-text-muted';
  };

  return (
    <Card
      className={`bg-monitor-panel ring-1 ring-monitor-line border-transparent rounded-lg shadow-none hover:bg-white/4 transition-colors ${className}`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
        <CardTitle className="text-xs font-medium text-monitor-text-muted">
          {title}
        </CardTitle>
        <div className="flex items-center gap-1 text-monitor-text-muted">
          {activityLevel && (
            <ActivityIndicator level={activityLevel} size="sm" />
          )}
          {icon}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="flex items-baseline gap-1">
          <div className="text-lg font-bold text-monitor-text-primary tabular-nums">
            {value}
          </div>
          {getTrendIcon()}
        </div>

        {description && (
          <p className={`text-xs mt-1 ${getTrendColor()}`}>{description}</p>
        )}

        {badge && (
          <Badge className="mt-1 text-xs bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-400/20">
            {badge}
          </Badge>
        )}

        {progress !== undefined && (
          <div className="mt-2">
            <Progress
              value={progress}
              className="h-1"
              color={
                progress > 80
                  ? 'bg-rose-500'
                  : progress > 50
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
              }
            />
            <p className="text-xs text-monitor-text-muted mt-1 tabular-nums">
              {progress.toFixed(1)}%
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const DashboardTabContent: React.FC<DashboardTabContentProps> = ({
  systemStats,
  statsCounters,
  filtersWithLiveStats,
  filtersMatchingCriteria,
  loading,
  monitoredFilters,
  onCardClick,
  refreshInterval,
}) => {
  // Calculate activity level based on processing filters
  const getSystemActivityLevel = (): ActivityLevel => {
    const processingRatio =
      statsCounters.total > 0
        ? statsCounters.processing / statsCounters.total
        : 0;
    if (processingRatio > 0.7) return 'high';
    if (processingRatio > 0.3) return 'medium';
    return 'low';
  };

  return (
    <div className="space-y-4">
      {/* Statistics Overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Badge className="text-xs bg-white/5 ring-1 ring-monitor-line text-monitor-text-secondary">
            Refresh: {refreshInterval}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {/* Data Processed */}
          <StatsCard
            title="Data Processed"
            value={formatBytes(systemStats.totalBytes)}
            icon={<LuDatabase className="h-4 w-4 text-monitor-text-muted" />}
            description={`${formatNumber(systemStats.totalPackets)} packets`}
            trend={systemStats.totalBytes > 0 ? 'up' : 'neutral'}
            activityLevel={
              systemStats.totalBytes > 1000000
                ? 'high'
                : systemStats.totalBytes > 100000
                  ? 'medium'
                  : 'low'
            }
          />

          {/* Processing Activity */}
          <StatsCard
            title="Processing Activity"
            value={statsCounters.processing}
            icon={<LuPlay className="h-4 w-4 text-muted-foreground" />}
            description={`${((statsCounters.processing / Math.max(statsCounters.total, 1)) * 100).toFixed(1)}% active`}
            trend={statsCounters.processing > 0 ? 'up' : 'neutral'}
            activityLevel={getSystemActivityLevel()}
          />

          {/* Pipeline Health */}
          <StatsCard
            title="Pipeline Status"
            value={`${statsCounters.sources}→${statsCounters.sinks}`}
            icon={<LuActivity className="h-4 w-4 text-monitor-text-muted" />}
            description="Sources to sinks"
            badge={statsCounters.processing > 0 ? 'Processing' : 'Idle'}
            trend={
              statsCounters.sources > 0 && statsCounters.sinks > 0
                ? 'up'
                : 'neutral'
            }
          />
        </div>
      </div>

      {/* Filters Grid */}
      <div>
        <FiltersGrid
          filtersWithLiveStats={filtersWithLiveStats}
          filtersMatchingCriteria={filtersMatchingCriteria}
          loading={loading}
          monitoredFilters={monitoredFilters}
          onCardClick={onCardClick}
        />
      </div>
    </div>
  );
};
