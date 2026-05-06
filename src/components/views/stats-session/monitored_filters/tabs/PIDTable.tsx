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
  ({ pids, filterIdx, onOpenProps, variant = 'input' }: PIDTableProps) => (
    <div className="overflow-x-auto bg-monitor-app">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/10 bg-monitor-panel">
            <th className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Infos
            </th>
            <th className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Rate / Last
            </th>
            <th className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide w-24">
              Buffer
            </th>
            <th className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide w-16">
              Stat
            </th>
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
  ),
);

PIDTable.displayName = 'PIDTable';

export default PIDTable;
