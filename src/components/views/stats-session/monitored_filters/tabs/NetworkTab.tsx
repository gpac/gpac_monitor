import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { LuUpload, LuDownload } from 'react-icons/lu';
import { NetworkTabData } from '@/types/domain/gpac/filter-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { BandwidthChart } from '../charts/BandwidthChart';
import { formatBytes, formatBitrate, formatPacketRate } from '@/utils/helper';

interface NetworkTabProps {
  data: NetworkTabData;
  filterName: string;
  refreshInterval?: number;
}

const NetworkTab = memo(({ data, filterName, refreshInterval = 5000 }: NetworkTabProps) => {
  const lastBytesRef = useRef({
    sent: data.bytesSent,
    received: data.bytesReceived,
    timestamp: Date.now(),
  });
  const [currentStats, setCurrentStats] = useState(data);
  const [instantRates, setInstantRates] = useState({
    bytesSentRate: 0,
    bytesReceivedRate: 0,
    packetsSentRate: 0,
    packetsReceivedRate: 0,
  });

  useEffect(() => {
    const now = Date.now();
    const timeDiff = (now - lastBytesRef.current.timestamp) / 1000; // en secondes
    
    // Calculate instant rates (per second)
    if (timeDiff > 0) {
      const bytesSentDelta = data.bytesSent - lastBytesRef.current.sent;
      const bytesReceivedDelta = data.bytesReceived - lastBytesRef.current.received;
      const packetsSentDelta = data.packetsSent - (lastBytesRef.current as any).packetsSent || 0;
      const packetsReceivedDelta = data.packetsReceived - (lastBytesRef.current as any).packetsReceived || 0;

      setInstantRates({
        bytesSentRate: Math.max(0, bytesSentDelta / timeDiff),
        bytesReceivedRate: Math.max(0, bytesReceivedDelta / timeDiff),
        packetsSentRate: Math.max(0, packetsSentDelta / timeDiff),
        packetsReceivedRate: Math.max(0, packetsReceivedDelta / timeDiff),
      });
    }

    lastBytesRef.current = {
      sent: data.bytesSent,
      received: data.bytesReceived,
      timestamp: now,
      ...(lastBytesRef.current as any),
      packetsSent: data.packetsSent,
      packetsReceived: data.packetsReceived,
    };

    setCurrentStats(data);
  }, [data, filterName]);

  const formattedStats = useMemo(
    () => ({
      bytesSent: formatBytes(currentStats.bytesSent),
      bytesReceived: formatBytes(currentStats.bytesReceived),
      packetsSent: currentStats.packetsSent.toLocaleString(),
      packetsReceived: currentStats.packetsReceived.toLocaleString(),
      // Instant rates
      bytesSentRate: formatBitrate(instantRates.bytesSentRate * 8), // Convert to bits
      bytesReceivedRate: formatBitrate(instantRates.bytesReceivedRate * 8),
      packetsSentRate: formatPacketRate(instantRates.packetsSentRate),
      packetsReceivedRate: formatPacketRate(instantRates.packetsReceivedRate),
    }),
    [currentStats, instantRates],
  );

  // Activity level based on current throughput
  const getActivityLevel = (byteRate: number) => {
    if (byteRate > 10000000) return { level: 'High', variant: 'default' as const, color: 'text-green-600' };
    if (byteRate > 1000000) return { level: 'Medium', variant: 'secondary' as const, color: 'text-blue-600' };
    if (byteRate > 0) return { level: 'Low', variant: 'outline' as const, color: 'text-orange-600' };
    return { level: 'Idle', variant: 'destructive' as const, color: 'text-gray-500' };
  };

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4">
        {/* Real-time throughput overview */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-stat border-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <LuUpload className="h-4 w-4 stat-label" />
                  Upload Rate
                </div>
                <Badge variant={getActivityLevel(instantRates.bytesSentRate).variant}>
                  {getActivityLevel(instantRates.bytesSentRate).level}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="text-2xl font-bold stat">
                  {formattedStats.bytesSentRate}
                </div>
                <div className="text-xs text-muted-foreground  stat-label">Data Rate</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-lg font-semibold stat">
                  {formattedStats.packetsSentRate}
                </div>
                <div className="text-xs text-muted-foreground stat-label">Packet Rate</div>
              </div>

              <div className="pt-2 border-t border-border/50">
                <div className="grid grid-cols-2 gap-y-1 text-xs">
                  <div className="text-muted-foreground stat-label">Total</div>
                  <div className="font-medium stat">{formattedStats.bytesSent}</div>
                  <div className="text-muted-foreground stat-label">Packets</div>
                  <div className="font-medium stat">{formattedStats.packetsSent}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-stat border-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <LuDownload className="h-4 w-4 stat-label" />
                  Download Rate
                </div>
                <Badge variant={getActivityLevel(instantRates.bytesReceivedRate).variant}>
                  {getActivityLevel(instantRates.bytesReceivedRate).level}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="text-2xl font-bold stat">
                  {formattedStats.bytesReceivedRate}
                </div>
                <div className="text-xs text-muted-foreground stat-label">Data Rate</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-lg font-semibold stat">
                  {formattedStats.packetsReceivedRate}
                </div>
                <div className="text-xs text-muted-foreground stat-label">Packet Rate</div>
              </div>

              <div className="pt-2 border-t border-border/50">
                <div className="grid grid-cols-2 gap-y-1 text-xs">
                  <div className="text-muted-foreground stat-label">Total</div>
                  <div className="font-medium stat">{formattedStats.bytesReceived}</div>
                  <div className="text-muted-foreground stat-label">Packets</div>
                  <div className="font-medium stat">{formattedStats.packetsReceived}</div>
                </div>
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