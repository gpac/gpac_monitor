import { memo } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
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
    <TooltipProvider delayDuration={300}>
      <div className="bg-monitor-app overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-[clamp(620px,60%,760px)] text-left table-fixed">
            <colgroup>
              <col className="w-[220px]" />
              <col className="w-[130px]" />
              <col className="w-[180px]" />
              <col className="w-[110px]" />
              <col className="w-[120px]" />
            </colgroup>

            <thead>
              <tr className="border-b border-white/10 bg-monitor-panel">
                <th className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Infos
                </th>
                <th className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Buffer
                </th>
                <th className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Bitrate/Proc.
                </th>

                <th className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Proc. Rate
                </th>
                <th className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  TS
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
      </div>
    </TooltipProvider>
  ),
);

PIDTable.displayName = 'PIDTable';

export default PIDTable;
