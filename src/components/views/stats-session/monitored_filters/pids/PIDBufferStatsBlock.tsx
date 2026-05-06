import { memo } from 'react';
import type { PIDproperties } from '@/types/domain/gpac/filter-stats';
import { technicalDetailsFont, metricLabelFont } from '@/utils/responsiveFonts';
import { formatPidBuffer } from '../../utils/pidFormatters';

interface PIDBufferStatsBlockProps {
  pid: PIDproperties;
}

const resolveData = (pid: PIDproperties) => {
  const { stats } = pid;
  return {
    bufferTime: stats.buffer_time ?? pid.buffer,
    maxBufferTime: stats.max_buffer_time ?? pid.max_buffer ?? null,
    nbUnits: stats.nb_buffer_units ?? null,
    minPlayout: stats.min_playout_time ?? null,
    maxPlayout: stats.max_playout_time ?? null,
  };
};

const hasData = (pid: PIDproperties): boolean => {
  const { stats } = pid;
  const hasDynamic = stats.buffer_time != null || stats.nb_buffer_units != null;
  return hasDynamic || pid.buffer > 0;
};

const StatRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-2">
    <span className={`${metricLabelFont} text-muted-foreground`}>{label}</span>
    <span className={`${technicalDetailsFont} font-mono text-info`}>
      {value}
    </span>
  </div>
);

export const PIDBufferStatsBlock = memo(({ pid }: PIDBufferStatsBlockProps) => {
  if (!hasData(pid)) return null;

  const { bufferTime, maxBufferTime, nbUnits, minPlayout, maxPlayout } =
    resolveData(pid);

  const hasPlayout = minPlayout != null && maxPlayout != null;

  return (
    <div className="space-y-0.5">
      <StatRow label="Buffer" value={formatPidBuffer(bufferTime)} />

      {maxBufferTime != null && (
        <StatRow label="Max buffer" value={formatPidBuffer(maxBufferTime)} />
      )}

      {nbUnits != null && <StatRow label="Units" value={String(nbUnits)} />}

      {hasPlayout && (
        <StatRow
          label="Playout"
          value={`${formatPidBuffer(minPlayout)} – ${formatPidBuffer(maxPlayout)}`}
        />
      )}
    </div>
  );
});

PIDBufferStatsBlock.displayName = 'PIDBufferStatsBlock';
