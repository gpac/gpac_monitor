import { memo } from 'react';
import { Panel } from '@xyflow/react';
import { FilterType } from '@/types/domain/gpac';
import { FILTER_COLORS, FILTER_LABELS } from '@/utils/filters/streamType';

const LEGEND_ITEMS = (Object.keys(FILTER_COLORS) as FilterType[]).map(
  (type) => ({
    type,
    label: FILTER_LABELS[type],
    color: FILTER_COLORS[type],
  }),
);

const GraphLegend = memo(() => {
  return (
    <Panel position="top-left" className="m-4">
      <div
        className="flex  gap-2 px-3 py-2 
        bg-gray-900/0 backdrop-blur"
      >
        <div className="text-xs font-cond text-gray-400 mb-1">Stream Types</div>
        {LEGEND_ITEMS.map(({ type, label, color }) => (
          <div key={type} className="flex items-center gap-2">
            <div
              className="w-2 h-0.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs font-cond text-gray-300">{label}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
});

GraphLegend.displayName = 'GraphLegend';

export default GraphLegend;
