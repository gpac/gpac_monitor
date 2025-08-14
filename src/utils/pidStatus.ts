import { LuCircleAlert, LuCheck } from 'react-icons/lu';
import { TabPIDData } from '@/types/domain/gpac/filter-stats';

export interface StatusInfo {
  status: string;
  variant: 'destructive' | 'default' | 'outline' | 'secondary';
  icon: typeof LuCheck;
}

/**
 * Calculate overall status for a group of PIDs
 * Used by InputCard and OutputCard components
 */
export const getOverallStatus = (pids: TabPIDData[]): StatusInfo => {
  const allPids = pids;

  if (allPids.some((pid) => pid.stats.disconnected || pid.would_block)) {
    return { status: 'Error', variant: 'destructive', icon: LuCircleAlert };
  }

  if (allPids.some((pid) => pid.playing)) {
    return { status: 'Active', variant: 'default', icon: LuCheck };
  }

  return { status: 'Idle', variant: 'outline', icon: LuCheck };
};

/**
 * Get status badge info for individual PID
 */
export const getPIDStatusBadge = (pid: TabPIDData) => {
  if (pid.stats.disconnected)
    return { text: 'Disconnected', variant: 'destructive' as const };
  if (pid.would_block)
    return { text: 'Blocked', variant: 'destructive' as const };
  if (pid.eos) return { text: 'EOS', variant: 'secondary' as const };
  if (pid.playing) return { text: 'Playing', variant: 'default' as const };
  return { text: 'Idle', variant: 'outline' as const };
};

/**
 * Calculate global status for multiple inputs/outputs
 */
export const getGlobalStatus = (pids: TabPIDData[], itemCount: number) => {
  const totalErrors = pids.filter(
    (pid) => pid.stats.disconnected || pid.would_block,
  ).length;
  const totalWarnings = pids.filter((pid) => pid.eos).length;
  const totalActive = pids.filter((pid) => pid.playing).length;

  return {
    totalItems: itemCount,
    totalPids: pids.length,
    errors: totalErrors,
    warnings: totalWarnings,
    active: totalActive,
  };
};
