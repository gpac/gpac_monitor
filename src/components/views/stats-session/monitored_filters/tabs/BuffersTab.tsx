import { memo } from 'react';
import { LuHardDrive, LuTriangle, LuInfo } from 'react-icons/lu';
import { BuffersTabData } from '@/types/domain/gpac/filter-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/utils/helper';
import { useBufferMetrics } from '../../hooks/data/useBufferMetrics';

interface BuffersTabProps {
  data: BuffersTabData;
}

const BuffersTab = memo(({ data }: BuffersTabProps) => {
  const { processedBuffers, totalBufferInfo, hasBuffers } =
    useBufferMetrics(data);
  const { name } = data;

  console.log('[BuffersTab] Buffer stats for filter', name, ':', {
    totalPids: processedBuffers.length,
    bufferDetails: processedBuffers,
    totalBufferInfo,
  });

  if (!hasBuffers) {
    return (
      <ScrollArea className="h-[400px]">
        <div className="py-8 text-center text-muted-foreground">
          No buffer information available for {name}
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4">
        {/* Total buffer overview */}
        <Card className="bg-stat border-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <LuHardDrive className="h-4 w-4 stat-label" />
              Buffer Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold">
                  {formatBytes(totalBufferInfo.totalBuffer)}
                </div>
                <div className="text-xs text-muted-foreground stat-label">
                  Used
                </div>
              </div>
              <div>
                <div className="text-xl font-bold">
                  {formatBytes(totalBufferInfo.totalCapacity)}
                </div>
                <div className="text-xs text-muted-foreground stat-label">
                  Total
                </div>
              </div>
              <div>
                <div className="text-xl font-bold">
                  {totalBufferInfo.averageUsage.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground stat-label">
                  Avg Usage
                </div>
              </div>
            </div>
            <div className="mt-3">
              <Progress value={totalBufferInfo.averageUsage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Individual PID buffers */}
        <div className="space-y-3">
          {processedBuffers.map((buffer) => (
            <Card key={buffer.name} className="bg-stat">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {buffer.name}
                    {buffer.health.status !== 'Healthy' && (
                      <LuTriangle className="h-3 w-3 stat-label" />
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={buffer.health.variant} className="text-xs">
                      {buffer.health.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Source: {buffer.sourceIdx || 'N/A'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Buffer Time Display (Primary metric) */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium stat-label">
                      Buffer Level
                    </span>
                    <div className="text-right">
                      <div className="text-lg font-bold stat">
                        {buffer.bufferTimeMs}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {buffer.formattedBuffer}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar with Color Coding */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Progress
                        value={buffer.usage}
                        className="h-3 flex-1 mr-2"
                        style={
                          {
                            '--progress-background':
                              buffer.health.status === 'Critical'
                                ? '#ef4444'
                                : buffer.health.status === 'Warning'
                                  ? '#f59e0b'
                                  : '#10b981',
                          } as React.CSSProperties
                        }
                      />
                      <span className="text-sm font-medium w-12 text-right">
                        {buffer.usage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0</span>
                      <span>{buffer.formattedBufferTotal}</span>
                    </div>
                  </div>

                  {/* Health Status Description */}
                  {buffer.health.status === 'Critical' && (
                    <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 p-1 rounded">
                      <LuInfo className="h-3 w-3" />
                      <span>Risk of underflow - data starvation possible</span>
                    </div>
                  )}
                  {buffer.health.status === 'Warning' && (
                    <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 p-1 rounded">
                      <LuInfo className="h-3 w-3" />
                      <span>Buffer running low - monitor for drops</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
});

BuffersTab.displayName = 'BuffersTab';

export default BuffersTab;
