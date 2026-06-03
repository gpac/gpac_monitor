import { memo, type ReactNode } from 'react';
import { formatBytes, formatNumber } from '@/utils/formatting';
import { MetricRow, TableSection } from './pid/shared';
import type { FilterStatusViewModel } from '../utils/statusViewModel';
import StatusArraySection from './status/StatusArraySection';
import StatusStateBadges from './status/StatusStateBadges';
import { StatusProgressBar, StatusBufferRow } from './status/StatusProgress';

export interface ProcessingValues {
  processSpeed: string;
  processPacketRate: string;
  pckDone: number;
  pckSent: number;
  pckIfceSent?: number;
  bytesDone: number;
  bytesSent: number;
}

interface OverviewContentGridProps {
  groups: FilterStatusViewModel;
  processing: ProcessingValues;
  isDetached: boolean;
}

const OverviewContentGrid = memo(
  ({ groups, processing, isDetached }: OverviewContentGridProps) => {
    const hasInfo =
      groups.info != null ||
      groups.textMetrics.length > 0 ||
      groups.buffer != null;
    const numericMetrics = groups.numericMetrics.filter((m) => !m.graphable);

    const staticCols: ReactNode[] = [];

    if (hasInfo || groups.primaryProgress != null) {
      staticCols.push(
        <div key="info" className="flex flex-col gap-1">
          {hasInfo && (
            <TableSection title="Info">
              {groups.info && (
                <MetricRow
                  label=""
                  value={groups.info}
                  isEven
                  valueClassName="italic text-muted-foreground"
                />
              )}
              {groups.textMetrics.map((metric, index) => (
                <MetricRow
                  key={metric.key}
                  label={metric.key}
                  value={metric.value}
                  isEven={index % 2 === 0}
                  valueClassName="italic text-muted-foreground truncate"
                />
              ))}
              {groups.buffer && <StatusBufferRow buffer={groups.buffer} />}
            </TableSection>
          )}
          {groups.primaryProgress && (
            <StatusProgressBar bar={groups.primaryProgress} />
          )}
        </div>,
      );
    }

    if (groups.arrays.length > 0) {
      staticCols.push(
        <div key="tracks" className="flex flex-col gap-1">
          {groups.arrays.map((array) => (
            <StatusArraySection key={array.key} array={array} />
          ))}
        </div>,
      );
    }

    if (numericMetrics.length > 0) {
      staticCols.push(
        <TableSection key="metrics" title="Metrics">
          {numericMetrics.map((metric, index) => (
            <MetricRow
              key={metric.key}
              label={metric.key}
              value={metric.value}
              isEven={index % 2 === 0}
              title={metric.tooltip}
            />
          ))}
        </TableSection>,
      );
    }

    const procCols: ReactNode[] = [
      <TableSection key="proc" title="Processing">
        <MetricRow
          label=" Filter Process speed"
          value={processing.processSpeed}
          isEven
        />
        <MetricRow
          label="Packets/s"
          value={processing.processPacketRate}
          isEven={false}
        />
      </TableSection>,
      <TableSection key="pack" title="Packets">
        <MetricRow
          label="Done"
          value={formatNumber(processing.pckDone)}
          isEven
        />
        <MetricRow
          label="Sent"
          value={formatNumber(processing.pckSent)}
          isEven={false}
        />
        {processing.pckIfceSent !== undefined && (
          <MetricRow
            label="Interface"
            value={formatNumber(processing.pckIfceSent)}
            isEven
          />
        )}
      </TableSection>,
      <TableSection key="data" title="Data">
        <MetricRow
          label="Done"
          value={formatBytes(processing.bytesDone)}
          isEven
        />
        <MetricRow
          label="Sent"
          value={formatBytes(processing.bytesSent)}
          isEven={false}
        />
      </TableSection>,
    ];

    if (isDetached) {
      return (
        <div className="flex flex-col gap-2">
          <StatusStateBadges badges={groups.stateBadges} />
          {staticCols}
          <div className="grid grid-cols-3 gap-2">{procCols}</div>
        </div>
      );
    }

    const allCols = [...staticCols, ...procCols];
    const gridTemplateColumns = [
      ...staticCols.map(() => 'minmax(0, 1.4fr)'),
      ...procCols.map(() => 'minmax(0, 0.8fr)'),
    ].join(' ');
    return (
      <div className="flex flex-col gap-2">
        <StatusStateBadges badges={groups.stateBadges} />
        <div className="grid gap-2 items-start" style={{ gridTemplateColumns }}>
          {allCols}
        </div>
      </div>
    );
  },
);

OverviewContentGrid.displayName = 'OverviewContentGrid';

export default OverviewContentGrid;
