import { useMemo, useCallback, memo } from 'react';
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

export const ToolSettingsDropdown = memo(function ToolSettingsDropdown({
  levelsByTool,
  defaultAllLevel,
  currentTool,
  onToolLevelChange,
  onDefaultAllLevelChange,
  onToolNavigate,
}: ToolSettingsDropdownProps) {
  const handleLevelChange = useCallback(
    (tool: GpacLogTool, level: GpacLogLevel) => {
      if (tool === GpacLogTool.ALL) {
        onDefaultAllLevelChange(level);
      } else {
        onToolLevelChange(tool, level);
      }
    },
    [onToolLevelChange, onDefaultAllLevelChange],
  );

  const sortedTools = useMemo(() => sortTools(currentTool), [currentTool]);

  const toolItems = useMemo(() => {
    return sortedTools.map((tool) => {
      const effectiveLevel = getEffectiveLevel(
        tool,
        levelsByTool,
        defaultAllLevel,
      );
      const isCurrentTool = tool === currentTool;

      return {
        tool,
        effectiveLevel,
        isCurrentTool,
        displayName: TOOL_DISPLAY_NAMES[tool],
        levelColor: LEVEL_COLORS[effectiveLevel],
      };
    });
  }, [sortedTools, levelsByTool, defaultAllLevel, currentTool]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <IoSettings className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-64 max-h-80 overflow-y-auto p-0"
      >
        <div className="relative">
          {/* Sticky Headers */}
          <div className="sticky top-0 w-full z-10 border-b border-gray-600 bg-gray-800 flex flex-col">
            <div className="px-3 py-2 text-sm font-normal  text-muted-foreground">
              Logs Configuration
            </div>
            <DropdownMenuSeparator />

            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground px-3 py-2">
              <span>Tool</span>
              <span>Level</span>
            </div>
          </div>

          {/* Vertical separator line - fixed */}
          <div className="absolute top-0 bottom-0 left-1/2 w-px transform -translate-x-1/2 z-5"></div>

          {/* Tools list */}
          {toolItems.map(
            ({
              tool,
              effectiveLevel,
              isCurrentTool,
              displayName,
              levelColor,
            }) => (
              <div
                key={tool}
                className="flex items-center py-2 px-3 text-gray-200 text-small  bg-gray-900 "
              >
                <span
                  className={`font-light cursor-pointer rounded-lg  hover:text-blue-200   transition-colors duration-200 px-1 py-1 w-1/2 ${
                    isCurrentTool ? 'text-black bg-gray-500' : ''
                  }`}
                  onClick={() => {
                    onToolNavigate?.(tool);
                  }}
                >
                  {displayName}
                </span>

                <div className="w-1/2 flex justify-end">
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="p-0 h-auto">
                      <Badge
                        variant="secondary"
                        className={`text-gray-200 text-xs cursor-pointer hover:opacity-80 ${levelColor}`}
                      >
                        {effectiveLevel}
                      </Badge>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-secondary">
                      {Object.values(GpacLogLevel).map((level) => (
                        <DropdownMenuItem
                          key={level}
                          className={`cursor-pointer ${
                            effectiveLevel === level
                              ? 'bg-accent text-accent-foreground'
                              : ''
                          }`}
                          onClick={() => handleLevelChange(tool, level)}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${LEVEL_COLORS[level]} opacity-80`}
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
            ),
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
