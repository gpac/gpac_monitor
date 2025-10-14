import { memo } from 'react';
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
  return (
    <div
      className="flex items-center py-2 px-3 text-gray-200 text-xs bg-gray-900"
      style={{ overflow: 'visible' }}
    >
      <span
        className={`font-light cursor-pointer transition-opacity duration-200 px-1 py-1 w-1/2 ${
          isCurrentTool
            ? 'text-gray-100 bg-gray-800 rounded-lg font-medium'
            : ''
        }`}
        onClick={() => onToolNavigate(tool)}
      >
        <span className="hover:text-blue-200 hover:opacity-80 inline-block transition-opacity duration-200">
          {displayName}
        </span>
      </span>

      <div className="w-1/2 flex justify-end">
        <DropdownMenuSub open={isSubMenuOpen} onOpenChange={onSubMenuToggle}>
          <DropdownMenuSubTrigger className="p-0 h-auto">
            <Badge
              variant="logs"
              className={`cursor-pointer transition-opacity duration-200 ${LEVEL_BADGE_CLASSES[effectiveLevel]}`}
            >
              {effectiveLevel}
            </Badge>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent
            className="bg-gray-950"
            onMouseLeave={onMouseLeaveSubMenu}
          >
            {Object.values(GpacLogLevel).map((level) => (
              <DropdownMenuItem
                key={level}
                className={`cursor-pointer transition-opacity duration-200 ${
                  effectiveLevel === level
                    ? 'bg-accent text-accent-foreground'
                    : ''
                }`}
                onSelect={(e) => {
                  e.preventDefault();
                  onLevelSelect(level);
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full opacity-80 ${LEVEL_BADGE_CLASSES[level].split(' ')[0]}`}
                  />
                  <span className="capitalize">{level}</span>
                  {effectiveLevel === level && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      Current
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </div>
    </div>
  );
});
