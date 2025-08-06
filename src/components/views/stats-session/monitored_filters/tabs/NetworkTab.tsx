import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { LuUpload, LuDownload } from 'react-icons/lu';
import { NetworkTabData } from '@/types/domain/gpac/filter-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BandwidthChart } from '../charts/BandwidthChart';
import { formatBytes } from '@/utils/helper';

interface NetworkTabProps {
  data: NetworkTabData;
  filterName: string;
  refreshInterval?: number;
}

const NetworkTab = memo(({ data, filterName, refreshInterval = 5000 }: NetworkTabProps) => {
  const lastBytesRef = useRef({
    sent: data.bytesSent,
    received: data.bytesReceived,
  });
  const [currentStats, setCurrentStats] = useState(data);

  console.log('[NetworkTab] Network stats for filter', filterName, ':', {
    currentStats: data,
    refreshInterval
  });

  useEffect(() => {
    const newBytesSent = data.bytesSent;
    const newBytesReceived = data.bytesReceived;

    const hasSentChanged =
      Math.abs(newBytesSent - lastBytesRef.current.sent) > 100;
    const hasReceivedChanged =
      Math.abs(newBytesReceived - lastBytesRef.current.received) > 100;

    if (hasSentChanged || hasReceivedChanged) {
      console.log('[NetworkTab] Stats changed for filter', filterName, ':', {
        previousBytes: lastBytesRef.current,
        newBytes: { sent: newBytesSent, received: newBytesReceived },
        changes: { sentChanged: hasSentChanged, receivedChanged: hasReceivedChanged }
      });

      lastBytesRef.current = {
        sent: newBytesSent,
        received: newBytesReceived,
      };

      setCurrentStats(data);
    }
  }, [data, filterName]);

  const formattedStats = useMemo(
    () => ({
      bytesSent: formatBytes(currentStats.bytesSent),
      bytesReceived: formatBytes(currentStats.bytesReceived),
      packetsSent: currentStats.packetsSent.toLocaleString(),
      packetsReceived: currentStats.packetsReceived.toLocaleString(),
    }),
    [currentStats],
  );

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4">
        {/* Network statistics summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-stat border-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <LuUpload className="h-4 w-4 stat-label" />
                Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-y-2">
                <div className="text-xs text-muted-foreground stat-label">Total data</div>
                <div className="text-sm font-medium">{formattedStats.bytesSent}</div>
                <div className="text-xs text-muted-foreground stat-label">Packets</div>
                <div className="text-sm font-medium">{formattedStats.packetsSent}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-stat border-transparent">
            <CardHeader className="pb-2 ">
              <CardTitle className="flex items-center gap-2 text-sm">
                <LuDownload className="h-4 w-4 stat-label" />
                Download
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-y-2">
                <div className="text-xs text-muted-foreground stat-label">Total data</div>
                <div className="text-sm font-medium">{formattedStats.bytesReceived}</div>
                <div className="text-xs text-muted-foreground stat-label">Packets</div>
                <div className="text-sm font-medium">{formattedStats.packetsReceived}</div>
              </div>
            </CardContent>
          </Card>

          <BandwidthChart
            currentBytes={currentStats.bytesSent}
            type="sent"
            refreshInterval={refreshInterval}
          />

          <BandwidthChart
            currentBytes={currentStats.bytesReceived}
            type="received"
            refreshInterval={refreshInterval}
          />
        </div>
      </div>
    </ScrollArea>
  );
});

NetworkTab.displayName = 'NetworkTab';

export default NetworkTab;