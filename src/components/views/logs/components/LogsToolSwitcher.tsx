import { memo } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { GpacLogLevel, GpacLogTool } from '@/types/domain/gpac/log-types';

interface LogsToolSwitcherProps {
  statusText: string;
  statusClassName: string;
  toolItems: Array<{
    tool: GpacLogTool;
    displayName: string;
    effectiveLevel: GpacLogLevel;
    isCurrentTool: boolean;
    levelColor: string;
  }>;
  onToolSelect: (tool: GpacLogTool) => void;
}

export const LogsToolSwitcher = memo(function LogsToolSwitcher({
  statusText,
  statusClassName,
  toolItems,
  onToolSelect,
}: LogsToolSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className={`cursor-pointer hover:opacity-80 transition-opacity ${statusClassName}`}
          role="button"
          tabIndex={0}
        >
          <Badge variant="status" className="pointer-events-none">
            {statusText}
          </Badge>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="center" side="bottom" sideOffset={4} className="w-auto bg-gray-950">
        <div className="px-3 py-1 text-xs text-muted-foreground">Quick Switch</div>
        <DropdownMenuSeparator />

        {toolItems.map(({ tool, displayName, effectiveLevel, isCurrentTool, levelColor }) => (
          <DropdownMenuItem
            key={tool}
            className={`cursor-pointer flex justify-between py-1 ${
              isCurrentTool ? 'bg-accent' : ''
            }`}
            onSelect={() => onToolSelect(tool)}
          >
            <span className="text-sm">{displayName}</span>
            <Badge variant="logs" className={`text-xs ${levelColor}`}>
              {effectiveLevel}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});