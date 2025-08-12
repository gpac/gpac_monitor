import { useMemo } from 'react';
import { TabPIDData } from '@/types/domain/gpac/filter-stats';
import {
  formatBitrate,
  formatPacketRate,
  formatTime,
  formatNumber,
} from '@/utils/helper';

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
  };
}

export const usePerformanceMetrics = (pidData: TabPIDData): PerformanceData => {
  const performanceData = useMemo(() => {
    // Calculate average processing time per item
    let averagePerItem: string | undefined;
    if (
      pidData.stats.nb_processed &&
      pidData.stats.total_process_time &&
      pidData.stats.nb_processed > 0
    ) {
      averagePerItem = formatTime(
        pidData.stats.total_process_time / pidData.stats.nb_processed,
      );
    }

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
      },
    };
  }, [pidData.stats]);

  return performanceData;
};
