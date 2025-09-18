import { useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IoSettings } from 'react-icons/io5';
import { GpacLogLevel, GpacLogTool } from '@/types/domain/gpac/log-types';
import { TOOL_DISPLAY_NAMES, LEVEL_COLORS } from '../utils/constants';
import { getEffectiveLevel, sortTools } from '../utils/toolUtils';

interface ToolSettingsDropdownProps {
  levelsByTool: Record<GpacLogTool, GpacLogLevel>;
  defaultAllLevel: GpacLogLevel;
  currentTool: GpacLogTool;
  onToolLevelChange: (tool: GpacLogTool, level: GpacLogLevel) => void;
  onDefaultAllLevelChange: (level: GpacLogLevel) => void;
  onToolNavigate?: (tool: GpacLogTool) => void;
}


export function ToolSettingsDropdown({
  levelsByTool,
  defaultAllLevel,
  currentTool,
  onToolLevelChange,
  onDefaultAllLevelChange,
  onToolNavigate,
}: ToolSettingsDropdownProps) {
  const handleLevelChange = (tool: GpacLogTool, level: GpacLogLevel) => {
    if (tool === GpacLogTool.ALL) {
      onDefaultAllLevelChange(level);
    } else {
      onToolLevelChange(tool, level);
    }
  };

  const sortedTools = useMemo(() => sortTools(currentTool), [currentTool]);

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <IoSettings className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto">
          <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
            Tool Logs Level
          </div>
          <DropdownMenuSeparator />

          {sortedTools.map((tool) => {
            const effectiveLevel = getEffectiveLevel(tool, levelsByTool, defaultAllLevel);
            const isCurrentTool = tool === currentTool;
            return (
              <div key={tool} className="flex items-center justify-between py-2 px-3">
                <span
                  className={`font-medium mr-2 cursor-pointer w-1/3 rounded-lg hover:bg-gray-600 hover:text-blue-200 transition-colors duration-200 ${
                    isCurrentTool ? 'text-black bg-gray-500' : ''
                  }`}
                  onClick={() => {
                    console.log('[ToolSettingsDropdown] Tool clicked:', tool);
                    onToolNavigate?.(tool);
                  }}
                >
                  {TOOL_DISPLAY_NAMES[tool]}
                </span>
                
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="p-0 h-auto">
                    <Badge
                      variant="secondary"
                      className={`text-gray-200 text-xs cursor-pointer hover:opacity-80 ${LEVEL_COLORS[effectiveLevel]}`}
                    >
                      {effectiveLevel}
                    </Badge>
                  </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-secondary">
                  {Object.values(GpacLogLevel).map((level) => (
                    <DropdownMenuItem
                      key={level}
                      className={`cursor-pointer ${
                        effectiveLevel === level ? 'bg-accent text-accent-foreground' : ''
                      }`}
                      onClick={() => handleLevelChange(tool, level)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${LEVEL_COLORS[level]} opacity-80`}
                        />
                        <span className="capitalize">{level}</span>
                        {effectiveLevel === level && (
                          <span className="ml-auto text-xs text-muted-foreground">Current</span>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </div>
            );
          })}
        </DropdownMenuContent>
    </DropdownMenu>
  );
}