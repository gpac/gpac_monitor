import { useMemo } from 'react';
import { TabPIDData } from '@/types/ui';
import {
  formatBitrate,
  formatPacketRate,
  formatTime,
  formatNumber,
} from '@/utils/formatting';

export interface PerformanceData {
  throughput: {
    dataBitrate: {
      average: string;
      max: string;
    };
    packetRate: {
      average: string;
      max: string;
    };
  };
  processing: {
    totalProcessed: string;
    totalTime: string;
    averagePerItem?: string;
    maxProcessTime?: string;
    firstProcessTime?: string;
    lastTsSent?: string;
  };
}

export const usePerformanceMetrics = (pidData: TabPIDData): PerformanceData => {
  const performanceData = useMemo(() => {
    // Calculate average processing time per item
    let averagePerItem: string | undefined;
    if (pidData.stats.nb_processed && pidData.stats.total_process_time) {
      averagePerItem = formatTime(
        pidData.stats.total_process_time / pidData.stats.nb_processed,
      );
    }

    const maxProcessTime =
      pidData.stats.max_process_time !== undefined &&
      pidData.stats.max_process_time > 0
        ? formatTime(pidData.stats.max_process_time)
        : undefined;

    return {
      throughput: {
        dataBitrate: {
          average: formatBitrate(pidData.stats.average_bitrate),
          max: formatBitrate(pidData.stats.max_bitrate),
        },
        packetRate: {
          average: formatPacketRate(pidData.stats.average_process_rate),
          max: formatPacketRate(pidData.stats.max_process_rate),
        },
      },
      processing: {
        totalProcessed: formatNumber(pidData.stats.nb_processed || 0),
        totalTime: formatTime(pidData.stats.total_process_time),
        averagePerItem,
        maxProcessTime,
        firstProcessTime:
          pidData.stats.first_process_time !== undefined
            ? formatTime(pidData.stats.first_process_time)
            : undefined,
        lastTsSent:
          pidData.stats.last_ts_sent !== undefined
            ? formatNumber(pidData.stats.last_ts_sent)
            : undefined,
      },
    };
  }, [
    pidData.stats.average_bitrate,
    pidData.stats.max_bitrate,
    pidData.stats.average_process_rate,
    pidData.stats.max_process_rate,
    pidData.stats.nb_processed,
    pidData.stats.total_process_time,
    pidData.stats.max_process_time,
    pidData.stats.first_process_time,
    pidData.stats.last_ts_sent,
  ]);

  return performanceData;
};
