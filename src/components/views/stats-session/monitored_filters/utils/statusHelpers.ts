import type { ParsedFilterStatus } from '@/workers/filterStatusParser';

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

const CRITICAL: HealthInfo = {
  variant: 'destructive',
  color: 'text-red-500',
  bgColor: 'bg-red-500/10',
  label: 'Critical',
};
const STALLED: HealthInfo = {
  variant: 'secondary',
  color: 'text-amber-500',
  bgColor: 'bg-amber-500/10',
  label: 'Stalled',
};
const WARNING: HealthInfo = {
  variant: 'secondary',
  color: 'text-amber-500',
  bgColor: 'bg-amber-500/10',
  label: 'Warning',
};
const WAITING: HealthInfo = {
  variant: 'secondary',
  color: 'text-sky-400',
  bgColor: 'bg-sky-500/10',
  label: 'Waiting',
};
// done + prog < 1 : stopped before completion (prog = progress at cancellation time)
const STOPPED: HealthInfo = {
  variant: 'secondary',
  color: 'text-amber-400',
  bgColor: 'bg-amber-400/10',
  label: 'Stopped',
};
const DONE: HealthInfo = {
  variant: 'default',
  color: 'text-green-400',
  bgColor: 'bg-green-400/10',
  label: 'Done',
};
const HEALTHY: HealthInfo = {
  variant: 'default',
  color: 'text-green-500',
  bgColor: 'bg-green-500/10',
  label: 'Healthy',
};

const hasBoolFlag = (
  parsedStatus: ParsedFilterStatus | null,
  key: string,
): boolean =>
  parsedStatus?.entries.some(
    (entry) => entry.type === 'bool' && entry.key === key,
  ) ?? false;

const getDoneState = (
  parsedStatus: ParsedFilterStatus | null,
): 'stopped' | 'done' | null => {
  if (!hasBoolFlag(parsedStatus, 'done')) return null;
  const progEntry = parsedStatus?.entries.find(
    (e) => e.type === 'num' && e.key === 'prog',
  );
  if (
    progEntry &&
    'value' in progEntry &&
    (progEntry as { value: number }).value < 1
  )
    return 'stopped';
  return 'done';
};

export const getFilterHealthInfo = (
  parsedStatus: ParsedFilterStatus | null,
  isStalled: boolean,
  alerts: FilterAlerts | null,
): HealthInfo => {
  if (alerts && alerts.errors > 0) return CRITICAL;
  if (isStalled) return STALLED;
  if (alerts && alerts.warnings > 0) return WARNING;
  if (hasBoolFlag(parsedStatus, 'wait')) return WAITING;
  const doneState = getDoneState(parsedStatus);
  if (doneState === 'stopped') return STOPPED;
  if (doneState === 'done') return DONE;
  return HEALTHY;
};
