import { memo } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { PIDWithIndex } from '../../../types';
import PIDTableRow from './PIDTableRow';
import DetachedPIDCard from './DetachedPIDCard';
import { useIsDetached } from '../../FilterViewContext';

type PIDTableVariant = 'input' | 'output';

interface PIDTableProps {
  pids: PIDWithIndex[];
  filterIdx: number;
  onOpenProps: (filterIdx: number, pidIdx: number) => void;
  variant?: PIDTableVariant;
  hoveredPidKey?: string | null;
}

const PIDTable = memo(
  ({
    pids,
    filterIdx,
    onOpenProps,
    variant = 'input',
    hoveredPidKey = null,
  }: PIDTableProps) => {
    const isDetached = useIsDetached();

    if (isDetached) {
      return (
        <TooltipProvider delayDuration={200}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-2 p-1">
            {pids.map((pid) => (
              <DetachedPIDCard
                key={`${pid.name}-${pid.pidIdx}`}
                pid={pid}
                filterIdx={filterIdx}
                variant={variant}
                wide={pids.length === 1}
              />
            ))}
          </div>
        </TooltipProvider>
      );
    }

    return (
      <TooltipProvider delayDuration={200}>
        <div className="bg-monitor-app overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-[clamp(620px,60%,760px)] text-left table-fixed">
              <colgroup>
                <col className="w-[220px]" />
                <col className="w-[100px]" />
                <col className="w-[160px]" />
                <col className="w-[80px]" />
                <col className="w-[100px]" />
                <col className="w-[100px]" />
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
                    Avg Bitrate
                  </th>
                  <th className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    Proc.
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
                    key={`${pid.name}-${pid.pidIdx}`}
                    pid={pid}
                    filterIdx={filterIdx}
                    onOpenProps={onOpenProps}
                    isEven={index % 2 === 0}
                    variant={variant}
                    hoveredPidKey={hoveredPidKey}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </TooltipProvider>
    );
  },
);

PIDTable.displayName = 'PIDTable';

export default PIDTable;
