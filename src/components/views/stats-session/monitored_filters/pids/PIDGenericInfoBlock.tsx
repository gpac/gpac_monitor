import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import type { PIDproperties } from '@/types/domain/gpac/filter-stats';
import { metricValueFont, metricLabelFont } from '@/utils/responsiveFonts';
import { formatPidBitrate, formatPidCount } from '../../utils/pidFormatters';

interface PIDGenericInfoBlockProps {
  pid: PIDproperties;
}

const MetricCell = ({ label, value }: { label: string; value: string }) => (
  <div className="text-center">
    <div className={`${metricValueFont} font-medium text-info tabular-nums`}>
      {value}
    </div>
    <div className={`${metricLabelFont} text-muted-foreground`}>{label}</div>
  </div>
);

export const PIDGenericInfoBlock = memo(({ pid }: PIDGenericInfoBlockProps) => {
  const showStatus = pid.would_block || pid.eos;

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-3 gap-2">
        <MetricCell label="Bitrate" value={formatPidBitrate(pid.bitrate)} />
        <MetricCell label="Queued" value={formatPidCount(pid.nb_pck_queued)} />
        <MetricCell
          label="Packets"
          value={formatPidCount(pid.stats?.nb_processed)}
        />
      </div>
      {showStatus && (
        <div className="flex gap-1.5">
          {pid.would_block && (
            <Badge
              variant="destructive"
              className="text-[10px] px-1.5 py-0 h-4"
            >
              Blocked
            </Badge>
          )}
          {pid.eos && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              EOS
            </Badge>
          )}
        </div>
      )}
    </div>
  );
});

PIDGenericInfoBlock.displayName = 'PIDGenericInfoBlock';
