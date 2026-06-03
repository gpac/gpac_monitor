import { memo } from 'react';
import { formatBytes, formatNumber } from '@/utils/formatting';
import { MetricRow, TableSection } from './pid/shared';

interface FilterProcessingMetricsProps {
  processSpeed: string;
  processPacketRate: string;
  pckDone: number;
  pckSent: number;
  pckIfceSent?: number;
  bytesDone: number;
  bytesSent: number;
}

const FilterProcessingMetrics = memo(
  ({
    processSpeed,
    processPacketRate,
    pckDone,
    pckSent,
    pckIfceSent,
    bytesDone,
    bytesSent,
  }: FilterProcessingMetricsProps) => (
    <div className="grid grid-cols-3 gap-2">
      <TableSection title="Processing">
        <MetricRow label=" Filter Process speed" value={processSpeed} isEven />
        <MetricRow label="Packets/s" value={processPacketRate} isEven={false} />
      </TableSection>

      <TableSection title="Packets">
        <MetricRow label="Done" value={formatNumber(pckDone)} isEven />
        <MetricRow label="Sent" value={formatNumber(pckSent)} isEven={false} />
        {pckIfceSent !== undefined && (
          <MetricRow
            label="Interface"
            value={formatNumber(pckIfceSent)}
            isEven
          />
        )}
      </TableSection>

      <TableSection title="Data">
        <MetricRow label="Done" value={formatBytes(bytesDone)} isEven />
        <MetricRow label="Sent" value={formatBytes(bytesSent)} isEven={false} />
      </TableSection>
    </div>
  ),
);

FilterProcessingMetrics.displayName = 'FilterProcessingMetrics';

export default FilterProcessingMetrics;
