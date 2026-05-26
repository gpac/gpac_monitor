export interface FilterAlerts {
  errors: number;
  warnings: number;
  info?: number;
}

export interface HealthInfo {
  variant: 'default' | 'secondary' | 'destructive';
  color: string;
  bgColor: string;
  label: string;
}

export const getFilterHealthInfo = (
  status: string,
  isStalled?: boolean,
  alerts?: FilterAlerts | null,
): HealthInfo => {
  const statusLower = status?.toLowerCase() || '';

  if (alerts && alerts.errors > 0) {
    return {
      variant: 'destructive',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      label: 'Critical',
    };
  }

  if (isStalled) {
    return {
      variant: 'secondary',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      label: 'Stalled',
    };
  }

  if (alerts && alerts.warnings > 0) {
    return {
      variant: 'secondary',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      label: 'Warning',
    };
  }

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

  return {
    variant: 'default',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    label: 'Healthy',
  };
};
