import { memo } from 'react';
import { useFilterChangeStatus } from '@/components/views/graph/hooks/state/useFilterChangeStatus';
import { StatusBadge } from './StatusBadge';

interface FilterChangeBadgesProps {
  filterIdx: number;
}

const FilterChangeBadges = memo(({ filterIdx }: FilterChangeBadgesProps) => {
  const { showPidBadge, showArgBadge } = useFilterChangeStatus(filterIdx);

  if (!showPidBadge && !showArgBadge) return null;

  return (
    <>
      <StatusBadge
        label="PID"
        colorScheme="red"
        visible={showPidBadge}
        title="PID reconfigured"
      />
      <StatusBadge
        label="ARG"
        colorScheme="violet"
        visible={showArgBadge}
        title="Argument updated"
      />
    </>
  );
});

FilterChangeBadges.displayName = 'FilterChangeBadges';

export default FilterChangeBadges;
