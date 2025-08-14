import { memo } from 'react';
import {
  FilterStatsResponse,
  TabPIDData,
} from '@/types/domain/gpac/filter-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/utils/helper';
import {
  getOverallStatus,
  getPIDStatusBadge,
  getGlobalStatus,
} from '@/utils/pidStatus';
import { getMediaTypeInfo } from '@/utils/filterMonitorUtils';

interface OutputsTabProps {
  filterData: FilterStatsResponse;
  filterName: string;
}

interface OutputCardProps {
  outputName: string;
  pidsByType: Record<string, TabPIDData[]>;
}

const OutputCard = memo(({ outputName, pidsByType }: OutputCardProps) => {
  const allPids = Object.values(pidsByType).flat();
  const overallStatus = getOverallStatus(allPids);
  const StatusIcon = overallStatus.icon;

  // Render media section for any type
  const renderMediaSection = (pids: TabPIDData[], type: string) => {
    return (
      <div className="space-y-3">
        {pids.map((pid) => {
          const statusBadge = getPIDStatusBadge(pid);

          return (
            <div key={pid.name} className="bg-background/50 rounded-lg p-3">
              {/* PID Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{pid.name}</span>
                  {pid.codec && (
                    <Badge variant="outline" className="text-xs">
                      {pid.codec.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <Badge variant={statusBadge.variant} className="text-xs">
                  {statusBadge.text}
                </Badge>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-sm font-medium">
                    {formatBytes(pid.buffer)}
                  </div>
                  <div className="text-xs text-muted-foreground">Buffer</div>
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {pid.buffer_total && pid.buffer_total > 0
                      ? `${((pid.buffer / pid.buffer_total) * 100).toFixed(1)}%`
                      : '0%'}
                  </div>
                  <div className="text-xs text-muted-foreground">Usage</div>
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {type.toLowerCase() === 'visual' && pid.width && pid.height
                      ? `${pid.width}x${pid.height}`
                      : type.toLowerCase() === 'audio' && pid.channels
                        ? `${pid.channels}ch`
                        : pid.nb_pck_queued || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {type.toLowerCase() === 'visual' && pid.width && pid.height
                      ? 'Resolution'
                      : type.toLowerCase() === 'audio' && pid.channels
                        ? 'Channels'
                        : 'Queued'}
                  </div>
                </div>
              </div>

              {/* Additional info for specific media types */}
              {type.toLowerCase() === 'audio' && pid.samplerate && (
                <div className="mt-2 text-center">
                  <span className="text-xs text-muted-foreground">
                    Sample Rate: {(pid.samplerate / 1000).toFixed(1)} kHz
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="bg-stat border-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <StatusIcon className="h-4 w-4" />
            {outputName}
          </CardTitle>
          <Badge variant={overallStatus.variant}>{overallStatus.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(pidsByType).length > 0 ? (
          <div
            className={`grid gap-4 ${Object.keys(pidsByType).length > 1 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}
          >
            {Object.entries(pidsByType).map(([type, pids]) => {
              const mediaInfo = getMediaTypeInfo(type);
              const MediaIcon = mediaInfo.icon;

              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <MediaIcon className={`h-4 w-4 ${mediaInfo.color}`} />
                    <span className="text-sm font-medium">
                      {mediaInfo.label}
                    </span>
                    <Badge variant="outline" className="text-xs ml-auto">
                      {pids.length} stream{pids.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  {renderMediaSection(pids, type)}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No streams available
          </div>
        )}
      </CardContent>
    </Card>
  );
});

OutputCard.displayName = 'OutputCard';

const OutputsTab = memo(({ filterData, filterName }: OutputsTabProps) => {
  const outputPids = filterData.opids ? Object.values(filterData.opids) : [];

  // Group PIDs by output destination and by type
  const groupedOutputs = outputPids.reduce(
    (acc, pid) => {
      // Extract output name (remove suffix if present)
      const outputName = pid.name.split('_')[0] || pid.name;

      if (!acc[outputName]) {
        acc[outputName] = {};
      }

      // Group by actual PID type
      const pidType = pid.type || 'Unknown';
      if (!acc[outputName][pidType]) {
        acc[outputName][pidType] = [];
      }
      acc[outputName][pidType].push(pid);

      return acc;
    },
    {} as Record<string, Record<string, TabPIDData[]>>,
  );

  const outputNames = Object.keys(groupedOutputs);

  const globalStatus = getGlobalStatus(outputPids, outputNames.length);

  return (
    <div className="space-y-4">
      {/* Global Status Bar */}
      {outputPids.length > 0 && (
        <div className="bg-background/30 border rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Global Status</span>
              <div className="flex items-center gap-3 text-sm">
                <span>
                  {globalStatus.totalItems} Output
                  {globalStatus.totalItems > 1 ? 's' : ''}
                </span>
                <span className="text-muted-foreground">•</span>
                <span>
                  {globalStatus.totalPids} Stream
                  {globalStatus.totalPids > 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {globalStatus.errors > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {globalStatus.errors} Error
                  {globalStatus.errors > 1 ? 's' : ''}
                </Badge>
              )}
              {globalStatus.warnings > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {globalStatus.warnings} Warning
                  {globalStatus.warnings > 1 ? 's' : ''}
                </Badge>
              )}
              {globalStatus.active > 0 && (
                <Badge variant="default" className="text-xs">
                  {globalStatus.active} Active
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Outputs Grid */}
      {outputNames.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {outputNames.map((outputName) => (
            <OutputCard
              key={outputName}
              outputName={outputName}
              pidsByType={groupedOutputs[outputName]}
            />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <span>No output PIDs available for {filterName}</span>
          </div>
        </div>
      )}
    </div>
  );
});

OutputsTab.displayName = 'OutputsTab';

export default OutputsTab;
