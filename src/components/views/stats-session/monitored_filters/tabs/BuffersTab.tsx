import { memo, useMemo } from 'react';
import { LuHardDrive } from 'react-icons/lu';
import { GpacNodeData } from '@/types/domain/gpac/model';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { formatBytes, getBufferProgressColor } from '@/utils/helper';

interface BuffersTabProps {
  filter: GpacNodeData;
}

const BuffersTab = memo(({ filter }: BuffersTabProps) => {
  const bufferInfo = useMemo(() => {
    if (!filter.ipid || Object.keys(filter.ipid).length === 0) {
      console.log('[BuffersTab] No buffer data available for filter:', filter.name);
      return [];
    }

    const buffers = Object.entries(filter.ipid).map(([pidName, pidData]) => {
      const bufferUsage =
        pidData.buffer_total > 0
          ? (pidData.buffer / pidData.buffer_total) * 100
          : 0;
      
      return {
        name: pidName,
        buffer: pidData.buffer,
        bufferTotal: pidData.buffer_total,
        usage: bufferUsage,
        color: getBufferProgressColor(bufferUsage),
        sourceIdx: pidData.source_idx,
      };
    });



    return buffers;
  }, [filter.ipid]);

  const totalBufferInfo = useMemo(() => {
    if (bufferInfo.length === 0) {
      return { totalBuffer: 0, totalCapacity: 0, averageUsage: 0 };
    }

    const totalBuffer = bufferInfo.reduce((sum, info) => sum + info.buffer, 0);
    const totalCapacity = bufferInfo.reduce(
      (sum, info) => sum + info.bufferTotal,
      0,
    );
    const averageUsage =
      bufferInfo.reduce((sum, info) => sum + info.usage, 0) / bufferInfo.length;

    const totals = { totalBuffer, totalCapacity, averageUsage };

    
    return totals;
  }, [bufferInfo]);

  if (bufferInfo.length === 0) {
    return (
      <ScrollArea className="h-[400px]">
        <div className="py-8 text-center text-muted-foreground">
          No buffer information available
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
                color={getBufferProgressColor(totalBufferInfo.averageUsage)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Individual PID buffers */}
        <div className="space-y-3">
          {bufferInfo.map((info) => (
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