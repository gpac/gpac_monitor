import { useMemo } from 'react';
import { TabPIDData } from '@/types/ui';
import { getHealthStatusFromMetrics } from '@/utils/metrics';

export interface CriticalState {
  key: string;
  label: string;
  value: string;
  status: 'critical' | 'warning' | 'info' | 'healthy';
  variant: 'destructive' | 'secondary' | 'outline' | 'default';
  priority: number;
  show: boolean;
}

export interface CriticalPIDMetrics {
  bufferUsage: number;
  overallHealth: {
    color: string;
    status: string;
    variant: 'default' | 'secondary' | 'destructive';
  };
  criticalStates: CriticalState[];
}

export const useCriticalPIDStats = (
  pidData: TabPIDData,
): CriticalPIDMetrics => {
  // Calculate buffer usage percentage
  const bufferUsage =
    pidData.buffer_total && pidData.buffer_total > 0
      ? (pidData.buffer / pidData.buffer_total) * 100
      : 0;

  // Get overall health assessment
  const overallHealth = getHealthStatusFromMetrics(
    pidData.buffer,
    pidData.would_block || false,
    pidData.stats.disconnected || false,
    pidData.nb_pck_queued || 0,
  );

  // Prepare critical states data
  const criticalStates = useMemo(
    () => [
      {
        key: 'connection',
        label: 'Connection',
        value: pidData.stats.disconnected ? 'Disconnected' : 'Connected',
        status: pidData.stats.disconnected
          ? ('critical' as const)
          : ('healthy' as const),
        variant: pidData.stats.disconnected
          ? ('destructive' as const)
          : ('default' as const),
        priority: 1,
        show: true,
      },
      {
        key: 'blocking',
        label: 'Flow Control',
        value: pidData.would_block ? 'BLOCKED' : 'Normal',
        status: pidData.would_block
          ? ('critical' as const)
          : ('healthy' as const),
        variant: pidData.would_block
          ? ('destructive' as const)
          : ('secondary' as const),
        priority: 2,
        show: pidData.would_block || false,
      },
      {
        key: 'queue',
        label: 'Queue',
        value: `${pidData.nb_pck_queued || 0} packets`,
        status:
          (pidData.nb_pck_queued || 0) > 50
            ? ('warning' as const)
            : ('healthy' as const),
        variant:
          (pidData.nb_pck_queued || 0) > 50
            ? ('secondary' as const)
            : ('outline' as const),
        priority: 3,
        show: (pidData.nb_pck_queued || 0) > 0,
      },
      {
        key: 'playback',
        label: 'Stream State',
        value: pidData.eos
          ? 'End of Stream'
          : pidData.playing
            ? 'Playing'
            : 'Paused',
        status: pidData.eos
          ? ('info' as const)
          : pidData.playing
            ? ('healthy' as const)
            : ('warning' as const),
        variant: pidData.eos
          ? ('outline' as const)
          : pidData.playing
            ? ('default' as const)
            : ('secondary' as const),
        priority: 5,
        show: true,
      },
    ],
    [pidData],
  );

  return {
    bufferUsage,
    overallHealth,
    criticalStates,
  };
};
