import { memo } from 'react';
import type { PIDWithIndex } from '../../types';
import PIDTableRow from './PIDTableRow';

type PIDTableVariant = 'input' | 'output';

interface PIDTableProps {
  pids: PIDWithIndex[];
  filterIdx: number;
  onOpenProps: (filterIdx: number, ipidIdx: number) => void;
  variant?: PIDTableVariant;
}

const PIDTable = memo(
  ({ pids, filterIdx, onOpenProps, variant = 'input' }: PIDTableProps) => {
    return (
      <div className="overflow-x-auto bg-monitor-app">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 bg-monitor-panel">
              <th className="px-2 py-1.5 min-w-[120px] text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                {variant === 'output' ? 'Stream Type' : 'Name'}
              </th>
              <th className="px-2 py-1.5 min-w-[60px] text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                Codec
              </th>
              <th className="px-2 py-1.5 min-w-[70px] text-right text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                Buffer
              </th>
              <th className="px-2 py-1.5 min-w-[70px] text-right text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                Bitrate
              </th>
              <th className="px-2 py-1.5 min-w-[70px] text-right text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                Res
              </th>
              <th className="px-2 py-1.5 min-w-[70px] text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                Status
              </th>
              {variant === 'input' && (
                <th className="px-2 py-1.5 w-10 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wide sticky right-0 bg-monitor-panel">
                  PROPERTIES
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {pids.map((pid, index) => (
              <PIDTableRow
                key={`${pid.name}-${pid.ipidIdx}`}
                pid={pid}
                filterIdx={filterIdx}
                onOpenProps={onOpenProps}
                isEven={index % 2 === 0}
                variant={variant}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  },
);

PIDTable.displayName = 'PIDTable';

export default PIDTable;
