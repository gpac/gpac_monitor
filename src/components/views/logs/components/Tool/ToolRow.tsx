import { memo, useMemo } from 'react';
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { GpacLogLevel, GpacLogTool } from '@/types/domain/gpac/log-types';
import { LEVEL_BADGE_CLASSES } from '../../utils/constants';

interface ToolRowProps {
  tool: GpacLogTool;
  displayName: string;
  effectiveLevel: GpacLogLevel;
  isCurrentTool: boolean;
  isSubMenuOpen: boolean;
  onToolNavigate: (tool: GpacLogTool) => void;
  onSubMenuToggle: (open: boolean) => void;
  onLevelSelect: (level: GpacLogLevel) => void;
  onMouseLeaveSubMenu: () => void;
}

export const ToolRow = memo(function ToolRow({
  tool,
  displayName,
  effectiveLevel,
  isCurrentTool,
  isSubMenuOpen,
  onToolNavigate,
  onSubMenuToggle,
  onLevelSelect,
  onMouseLeaveSubMenu,
}: ToolRowProps) {
  // Filter out debug level for "all" tool
  const availableLevels = useMemo(
    () =>
      Object.values(GpacLogLevel).filter(
        (level) => !(tool === GpacLogTool.ALL && level === GpacLogLevel.DEBUG),
      ),
    [tool],
  );

  return (
    <div
      className="flex items-center z-10 px-3 py-2 text-xs
        text-slate-200 bg-slate-900
        hover:bg-slate-800/60 transition-colors"
      style={{ overflow: 'visible' }}
    >
      <span
        onClick={() => onToolNavigate(tool)}
        className={`w-1/2 px-1 py-1 cursor-pointer transition
          ${
            isCurrentTool
              ? 'text-slate-100 bg-slate-800 rounded-lg font-medium ring-1 ring-emerald-700/40'
              : 'text-slate-300 hover:text-slate-100'
          }`}
      >
        <span className="inline-block">{displayName}</span>
      </span>

      <div className="w-1/2 flex justify-end">
        <DropdownMenuSub open={isSubMenuOpen} onOpenChange={onSubMenuToggle}>
          <DropdownMenuSubTrigger className="p-0 h-auto">
            <Badge
              variant="logs"
              className={`cursor-pointer transition
                ring-1 ring-slate-700/40
                ${LEVEL_BADGE_CLASSES[effectiveLevel]}
                `}
            >
              {effectiveLevel}
            </Badge>
          </DropdownMenuSubTrigger>

          <DropdownMenuSubContent
            className="z-50 bg-monitor-surface/55 border border-slate-700/50
              shadow-lg shadow-black/40 rounded-md"
            onMouseLeave={onMouseLeaveSubMenu}
          >
            {availableLevels.map((level) => {
              const isSelected = effectiveLevel === level;
              return (
                <DropdownMenuItem
                  key={level}
                  className={`cursor-pointer text-sm
                    text-slate-200 hover:bg-slate-800/60
                    ${isSelected ? 'bg-emerald-500/10 text-emerald-300' : ''}`}
                  onSelect={(e) => {
                    e.preventDefault();
                    onLevelSelect(level);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full
                        ${isSelected ? 'bg-emerald-400' : LEVEL_BADGE_CLASSES[level].split(' ')[0]}`}
                    />
                    <span className="capitalize font-cond">{level}</span>
                    {isSelected && (
                      <span className="ml-auto text-[11px] text-slate-400">
                        Current
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </div>
    </div>
  );
});
