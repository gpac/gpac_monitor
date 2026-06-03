import { memo } from 'react';
import { formatBytes, formatNumber } from '@/utils/formatting';
import { MetricRow, TableSection } from './pid/shared';

export interface ProcessingValues {
  processSpeed: string;
  processPacketRate: string;
  pckDone: number;
  pckSent: number;
  pckIfceSent?: number;
  bytesDone: number;
  bytesSent: number;
}

interface RuntimeDetailsSectionProps {
  processing: ProcessingValues;
}

const RuntimeDetailsSection = memo(
  ({ processing }: RuntimeDetailsSectionProps) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-start">
      <TableSection title="Processing">
        <MetricRow
          label="Filter Process speed"
          value={processing.processSpeed}
        />
        <MetricRow label="Packets/s" value={processing.processPacketRate} />
      </TableSection>
      <TableSection title="Packets">
        <MetricRow label="Done" value={formatNumber(processing.pckDone)} />
        <MetricRow label="Sent" value={formatNumber(processing.pckSent)} />
        {processing.pckIfceSent !== undefined && (
          <MetricRow
            label="Interface"
            value={formatNumber(processing.pckIfceSent)}
          />
        )}
      </TableSection>
      <TableSection title="Data">
        <MetricRow label="Done" value={formatBytes(processing.bytesDone)} />
        <MetricRow label="Sent" value={formatBytes(processing.bytesSent)} />
      </TableSection>
    </div>
  ),
);

RuntimeDetailsSection.displayName = 'RuntimeDetailsSection';

export default RuntimeDetailsSection;
