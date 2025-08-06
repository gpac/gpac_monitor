import { memo } from 'react';
import { LuHardDrive } from 'react-icons/lu';
import { BuffersTabData } from '@/types/domain/gpac/filter-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { formatBytes } from '@/utils/helper';

interface BuffersTabProps {
  data: BuffersTabData;
}

const BuffersTab = memo(({ data }: BuffersTabProps) => {
  const { inputBuffers, totalBufferInfo, name } = data;
  
  console.log('[BuffersTab] Buffer stats for filter', name, ':', {
    totalPids: inputBuffers.length,
    bufferDetails: inputBuffers,
    totalBufferInfo
  });

  if (inputBuffers.length === 0) {
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
                <div className="text-xs text-muted-foreground stat-label">Used</div>
              </div>
              <div>
                <div className="text-xl font-bold">
                  {formatBytes(totalBufferInfo.totalCapacity)}
                </div>
                <div className="text-xs text-muted-foreground stat-label">Total</div>
              </div>
              <div>
                <div className="text-xl font-bold">
                  {totalBufferInfo.averageUsage.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground stat-label">Avg Usage</div>
              </div>
            </div>
            <div className="mt-3">
              <Progress
                value={totalBufferInfo.averageUsage}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Individual PID buffers */}
        <div className="space-y-3">
          {inputBuffers.map((info) => (
            <Card key={info.name} className="bg-stat">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{info.name}</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    Source: {info.sourceIdx || 'N/A'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm stat-label">
                    <span>Buffer Usage</span>
                    <span className="font-medium">
                      {formatBytes(info.buffer)} / {formatBytes(info.bufferTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Progress
                      value={info.usage}
                      className="h-2 flex-1 mr-2"
                      color={info.color}
                    />
                    <span className="text-sm font-medium w-12 text-right">
                      {info.usage.toFixed(1)}%
                    </span>
                  </div>
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