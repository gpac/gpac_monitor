import { memo } from 'react';
import type { PIDWithIndex } from '../../types';
import PIDTableRow from './PIDTableRow';

interface PIDTableProps {
  pids: PIDWithIndex[];
  filterIdx: number;
  onOpenProps: (filterIdx: number, ipidIdx: number) => void;
}

const PIDTable = memo(({ pids, filterIdx, onOpenProps }: PIDTableProps) => {
  return (
    <div className="overflow-x-auto bg-monitor-app">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/10 bg-monitor-panel">
            <th className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Name
            </th>
            <th className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Codec
            </th>
            <th className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Buffer
            </th>
            <th className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Bitrate
            </th>
            <th className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Res
            </th>
            <th className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Status
            </th>
            <th className="px-2 py-1.5 w-8 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              PROPERTIES
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
            />
          ))}
        </tbody>
      </table>
    </div>
  );
});

PIDTable.displayName = 'PIDTable';

export default PIDTable;
