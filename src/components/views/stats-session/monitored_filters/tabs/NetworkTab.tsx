import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { LuUpload, LuDownload } from 'react-icons/lu';
import { GpacNodeData } from '@/types/domain/gpac/model';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BandwidthChart } from '../charts/BandwidthChart';
import { formatBytes } from '@/utils/helper';

interface NetworkTabProps {
  filter: GpacNodeData;
  refreshInterval?: number;
}

const NetworkTab = memo(({ filter, refreshInterval = 5000 }: NetworkTabProps) => {
  const lastBytesRef = useRef({
    sent: filter.bytes_sent || 0,
    received: filter.bytes_done || 0,
  });
  const [currentStats, setCurrentStats] = useState({
    bytesSent: filter.bytes_sent || 0,
    bytesReceived: filter.bytes_done || 0,
    packetsSent: filter.pck_sent || 0,
    packetsReceived: filter.pck_done || 0,
  });



  useEffect(() => {
    const newBytesSent = filter.bytes_sent || 0;
    const newBytesReceived = filter.bytes_done || 0;

    const hasSentChanged =
      Math.abs(newBytesSent - lastBytesRef.current.sent) > 100;
    const hasReceivedChanged =
      Math.abs(newBytesReceived - lastBytesRef.current.received) > 100;

    if (hasSentChanged || hasReceivedChanged) {
  

      lastBytesRef.current = {
        sent: newBytesSent,
        received: newBytesReceived,
      };

      setCurrentStats({
        bytesSent: newBytesSent,
        bytesReceived: newBytesReceived,
        packetsSent: filter.pck_sent || 0,
        packetsReceived: filter.pck_done || 0,
      });
    }
  }, [filter.bytes_sent, filter.bytes_done, filter.pck_sent, filter.pck_done]);

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