import { memo } from 'react';
import { Panel } from '@xyflow/react';
import { FilterType } from '@/types/domain/gpac';

interface LegendItem {
  type: FilterType;
  label: string;
  color: string;
}

const LEGEND_ITEMS: LegendItem[] = [
  { type: 'video', label: 'Video', color: '#3b82f6' },
  { type: 'audio', label: 'Audio', color: '#10b981' },
  { type: 'text', label: 'Text', color: '#f59e0b' },
  { type: 'file', label: 'File', color: '#E11D48' },
];

const GraphLegend = memo(() => {
  return (
    <Panel position="top-left" className="m-4">
      <div
        className="flex flex-col gap-2 px-3 py-2 rounded-lg
        bg-gray-900/90 backdrop-blur border border-gray-700
        shadow-lg"
      >
        <div className="text-xs font-cond text-gray-400 mb-1">Stream Types</div>
        {LEGEND_ITEMS.map(({ type, label, color }) => (
          <div key={type} className="flex items-center gap-2">
            <div
              className="w-8 h-0.5 rounded-full"
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
