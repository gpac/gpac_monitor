import { memo } from 'react';
import { useDetachedFilterSelector } from '../hooks/filters/useDetachedFilterSelector';
import { DetachedFilterMenu } from './DetachedFilterMenu';

interface DetachedFilterSelectorProps {
  widgetId: string;
  filterIdx: number;
}

export const DetachedFilterSelector = memo(
  ({ widgetId, filterIdx }: DetachedFilterSelectorProps) => {
    const { currentName, options, selectFilter } = useDetachedFilterSelector(
      widgetId,
      filterIdx,
    );

    return (
      <DetachedFilterMenu
        currentName={currentName}
        options={options}
        onSelect={selectFilter}
      />
    );
  },
);

DetachedFilterSelector.displayName = 'DetachedFilterSelector';
