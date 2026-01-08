import { IconType } from 'react-icons';
import {
  LuPlay,
  LuPause,
  LuWifiOff,
  LuTriangle,
  LuClock,
} from 'react-icons/lu';
import { TabPIDData } from '@/types/domain/gpac/filter-stats';

export interface StatusInfo {
  status: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon?: IconType;
  color?: string;
}

export interface HealthInfo {
  variant: 'default' | 'secondary' | 'destructive';
  color: string;
  bgColor: string;
  label: string;
}

/**
 * Gets comprehensive PID status information including playback state
 */
export const getPIDStatusInfo = (pidData: TabPIDData): StatusInfo => {
  if (pidData.stats.disconnected) {
    return {
      status: 'Disconnected',
      variant: 'destructive',
      icon: LuWifiOff,
      color: 'text-danger',
    };
  }

  if (pidData.would_block) {
    return {
      status: 'Blocked',
      variant: 'destructive',
      icon: LuTriangle,
      color: 'text-danger',
    };
  }

  if (pidData.eos) {
    return {
      status: 'End of Stream',
      variant: 'secondary',
      icon: LuPause,
    };
  }

  if (pidData.playing) {
    return {
      status: 'Playing',
      variant: 'default',
      icon: LuPlay,
      color: 'text-info',
    };
  }

  return {
    status: 'Idle',
    variant: 'outline',
    icon: LuPause,
  };
};

/**
 * Gets playback status with icon for compact displays
 */
export const getPlaybackStatus = (
  pidData: TabPIDData,
): { icon: IconType; label: string; variant: StatusInfo['variant'] } => {
  if (pidData.eos) {
    return { icon: LuPause, label: 'EOS', variant: 'outline' };
  }
  if (pidData.playing) {
    return { icon: LuPlay, label: 'Playing', variant: 'default' };
  }
  return { icon: LuPause, label: 'Paused', variant: 'outline' };
};

export interface FilterAlerts {
  errors: number;
  warnings: number;
  info?: number;
}

/**
 * Gets filter health status from GPAC status, stalled state, and log alerts
 * Priority: real errors > stalled > real warnings > status text > healthy
 */
export const getFilterHealthInfo = (
  status: string,
  isStalled?: boolean,
  alerts?: FilterAlerts | null,
): HealthInfo => {
  const statusLower = status?.toLowerCase() || '';

  // HIGHEST PRIORITY: Real errors from logs
  if (alerts && alerts.errors > 0) {
    return {
      variant: 'destructive',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      label: 'Critical',
    };
  }

  // SECOND: Stalled state (performance issue)
  if (isStalled) {
    return {
      variant: 'secondary',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      label: 'Stalled',
    };
  }

  // THIRD: Real warnings from logs
  if (alerts && alerts.warnings > 0) {
    return {
      variant: 'secondary',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      label: 'Warning',
    };
  }

  // FOURTH: Status text analysis (fallback)
  if (statusLower.includes('error') || statusLower.includes('stop')) {
    return {
      variant: 'destructive',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      label: 'Critical',
    };
  }

  if (
    statusLower.includes('warning') ||
    statusLower.includes('wait') ||
    statusLower.includes('block')
  ) {
    return {
      variant: 'secondary',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      label: 'Warning',
    };
  }

  // DEFAULT: Healthy
  return {
    variant: 'default',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    label: 'Healthy',
  };
};

/**
 * Gets critical alerts for PID
 */
export const getCriticalAlerts = (pidData: TabPIDData) => {
  const alerts = [];

  if (pidData.stats.disconnected) {
    alerts.push({
      icon: LuWifiOff,
      color: 'text-danger',
      label: 'Disconnected',
    });
  }

  if (pidData.would_block) {
    alerts.push({
      icon: LuTriangle,
      color: 'text-danger',
      label: 'Blocked',
    });
  }

  if ((pidData.nb_pck_queued || 0) > 50) {
    alerts.push({
      icon: LuClock,
      color: 'text-warning',
      label: `Queue: ${pidData.nb_pck_queued}`,
    });
  }

  return alerts;
};

/**
 * Gets PID type for display
 */
export const getPIDType = (pidData: TabPIDData): string => {
  if (pidData.width && pidData.height) return 'Video';
  if (pidData.samplerate || pidData.channels) return 'Audio';
  if (pidData.codec) return 'Media';
  return 'Data';
};
