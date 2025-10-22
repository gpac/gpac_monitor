import { useEffect, useMemo, useRef, useState } from 'react';
import { NetworkTabData } from '@/types/domain/gpac/filter-stats';
import {
  formatBytes,
  formatBitrate,
  formatPacketRate,
} from '@/utils/formatting';

export interface NetworkMetrics {
  currentStats: NetworkTabData;
  instantRates: {
    bytesSentRate: number;
    bytesReceivedRate: number;
    packetsSentRate: number;
    packetsReceivedRate: number;
  };
  formattedStats: {
    bytesSent: string;
    bytesReceived: string;
    packetsSent: string;
    packetsReceived: string;
    bytesSentRate: string;
    bytesReceivedRate: string;
    packetsSentRate: string;
    packetsReceivedRate: string;
  };
  getActivityLevel: (byteRate: number) => {
    level: 'High' | 'Medium' | 'Low' | 'Idle';
    variant: 'default' | 'secondary' | 'outline' | 'destructive';
    color: string;
  };
}

export const useNetworkMetrics = (
  data: NetworkTabData,
  filterName: string,
): NetworkMetrics => {
  const lastBytesRef = useRef({
    sent: data.bytesSent,
    received: data.bytesReceived,
    packetsSent: data.packetsSent,
    packetsReceived: data.packetsReceived,
    timestamp: Date.now(),
  });

  const [currentStats, setCurrentStats] = useState(data);
  const [instantRates, setInstantRates] = useState({
    bytesSentRate: 0,
    bytesReceivedRate: 0,
    packetsSentRate: 0,
    packetsReceivedRate: 0,
  });

  // Calculate instant rates
  useEffect(() => {
    const now = Date.now();
    const timeDiff = (now - lastBytesRef.current.timestamp) / 1000;

    if (timeDiff > 0) {
      const bytesSentDelta = data.bytesSent - lastBytesRef.current.sent;
      const bytesReceivedDelta =
        data.bytesReceived - lastBytesRef.current.received;
      const packetsSentDelta =
        data.packetsSent - lastBytesRef.current.packetsSent;
      const packetsReceivedDelta =
        data.packetsReceived - lastBytesRef.current.packetsReceived;

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
      packetsSent: data.packetsSent,
      packetsReceived: data.packetsReceived,
      timestamp: now,
    };

    setCurrentStats(data);
  }, [data, filterName]);

  // Format statistics for display
  const formattedStats = useMemo(
    () => ({
      bytesSent: formatBytes(currentStats.bytesSent),
      bytesReceived: formatBytes(currentStats.bytesReceived),
      packetsSent: currentStats.packetsSent.toLocaleString(),
      packetsReceived: currentStats.packetsReceived.toLocaleString(),
      bytesSentRate: formatBitrate(instantRates.bytesSentRate * 8),
      bytesReceivedRate: formatBitrate(instantRates.bytesReceivedRate * 8),
      packetsSentRate: formatPacketRate(instantRates.packetsSentRate),
      packetsReceivedRate: formatPacketRate(instantRates.packetsReceivedRate),
    }),
    [currentStats, instantRates],
  );

  // Activity level logic
  const getActivityLevel = (byteRate: number) => {
    if (byteRate > 10000000)
      return {
        level: 'High' as const,
        variant: 'default' as const,
        color: 'text-green-600',
      };
    if (byteRate > 1000000)
      return {
        level: 'Medium' as const,
        variant: 'secondary' as const,
        color: 'text-blue-600',
      };
    if (byteRate > 0)
      return {
        level: 'Low' as const,
        variant: 'outline' as const,
        color: 'text-orange-600',
      };
    return {
      level: 'Idle' as const,
      variant: 'destructive' as const,
      color: 'text-gray-500',
    };
  };

  return {
    currentStats,
    instantRates,
    formattedStats,
    getActivityLevel,
  };
};
