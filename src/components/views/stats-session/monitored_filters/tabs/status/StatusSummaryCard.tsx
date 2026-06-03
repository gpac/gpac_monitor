import { memo } from 'react';
import type { FilterStatusViewModel } from '../../utils/statusViewModel';
import { MetricRow, TableSection } from '../pid/shared';
import StatusStateBadges from './StatusStateBadges';
import StatusArraySection from './StatusArraySection';
import { StatusProgressBar, StatusBufferRow } from './StatusProgress';

const StatusSummaryCard = memo(
  ({ groups }: { groups: FilterStatusViewModel }) => {
    const hasInfo = groups.info != null || groups.textMetrics.length > 0;
    const hasTracks = groups.arrays.length > 0;
    const twoColumns = hasInfo && hasTracks;

    return (
      <section className="space-y-1 rounded-sm bg-black/20 ring-1 ring-white/5 mt-1">
        {groups.stateBadges.length > 0 && (
          <StatusStateBadges badges={groups.stateBadges} />
        )}

        <div className={twoColumns ? 'grid grid-cols-2 gap-2' : ''}>
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
            </TableSection>
          )}

          {hasTracks && (
            <TableSection title="Tracks">
              {groups.arrays.map((array) => (
                <StatusArraySection key={array.key} array={array} />
              ))}
            </TableSection>
          )}
        </div>

        {groups.numericMetrics.length > 0 && (
          <TableSection title="Metrics">
            {groups.numericMetrics.map((metric, index) => (
              <MetricRow
                key={metric.key}
                label={metric.key}
                value={metric.value}
                isEven={index % 2 === 0}
                title={metric.tooltip}
              />
            ))}
          </TableSection>
        )}

        {groups.primaryProgress && (
          <StatusProgressBar bar={groups.primaryProgress} />
        )}
        {groups.buffer && <StatusBufferRow buffer={groups.buffer} />}
      </section>
    );
  },
);

StatusSummaryCard.displayName = 'StatusSummaryCard';

export default StatusSummaryCard;
