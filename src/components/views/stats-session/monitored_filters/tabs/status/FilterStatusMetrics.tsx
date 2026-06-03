import type { FilterStatusViewModel } from '../../utils/statusViewModel';
import { TableSection, MetricRow } from '../pid/shared';
import StatusMetricsTable from './StatusMetricsTable';
import StatusStateBadges from './StatusStateBadges';
import StatusArraySection from './StatusArraySection';
import { StatusProgressBar, StatusBufferRow } from './StatusProgress';

function FilterStatusMetrics({
  groups,
  filterIdx,
}: {
  groups: FilterStatusViewModel;
  filterIdx: number;
}) {
  const hasInfo = groups.info != null || groups.textMetrics.length > 0;
  return (
    <section className="space-y-1 rounded-sm bg-black/20 ring-1 ring-white/5 mt-1 ">
      {hasInfo && (
        <TableSection title="Info">
          {groups.info && (
            <MetricRow
              label=""
              value={groups.info}
              isEven
              valueClassName="italic text-muted-foreground "
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
      {groups.stateBadges.length > 0 && (
        <StatusStateBadges badges={groups.stateBadges} />
      )}
      <StatusMetricsTable
        metrics={groups.numericMetrics}
        filterIdx={filterIdx}
      />
      {groups.primaryProgress && (
        <StatusProgressBar bar={groups.primaryProgress} />
      )}
      {groups.buffer && <StatusBufferRow buffer={groups.buffer} />}
      {groups.arrays.map((array) => (
        <StatusArraySection key={array.key} array={array} />
      ))}
    </section>
  );
}

export default FilterStatusMetrics;
