import type { ReactNode } from 'react';
import GraphRadio from './GraphRadio';

export interface SeriesLegendItem {
  key: string;
  label: string;
  color?: string;
  active: boolean;
  disabled?: boolean;
  onToggle: () => void;
  tooltip?: ReactNode;
}

interface SeriesLegendProps {
  items: SeriesLegendItem[];
}

function SeriesLegend({ items }: SeriesLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 normal-case">
      {items.map((item) => (
        <span
          key={item.key}
          className={`inline-flex items-center gap-1 ${item.disabled ? 'opacity-40' : ''}`}
        >
          <GraphRadio
            active={item.active}
            label={item.label}
            color={item.color}
            onClick={item.disabled ? () => {} : item.onToggle}
          />
          <span
            className="inline-block h-0.5 w-3 rounded-sm transition-colors"
            style={{
              backgroundColor:
                item.active && item.color
                  ? item.color
                  : 'var(--muted-foreground, #555)',
            }}
          />
          <button
            type="button"
            onClick={item.disabled ? undefined : item.onToggle}
            disabled={item.disabled}
            className={`text-[11px] font-mono leading-none transition-colors capitalize text-muted-foreground ${
              !item.disabled ? 'hover:text-info' : ''
            }`}
          >
            {item.label}
          </button>
          {item.tooltip}
        </span>
      ))}
    </div>
  );
}

export default SeriesLegend;
