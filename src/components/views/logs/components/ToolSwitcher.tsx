import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GpacLogLevel, GpacLogTool } from '@/types/domain/gpac/log-types';
import { LEVEL_COLORS } from '../utils/constants';
import { bgToTextColor, getEffectiveLevel } from '../utils/toolUtils';
import { Button } from '@/components/ui/button';
import * as Checkbox from '@radix-ui/react-checkbox';
import { FaCheck } from 'react-icons/fa';

interface ToolSwitcherProps {
  currentTool: GpacLogTool;
  levelsByTool: Record<GpacLogTool, GpacLogLevel>;
  defaultAllLevel: GpacLogLevel;
  visibleLogsCount: number;
  logCountsByTool: Record<string, number>;
  visibleToolsFilter: GpacLogTool[];
  onToolSelect: (tool: GpacLogTool) => void;
  onToggleToolFilter?: (tool: GpacLogTool) => void;
  onClearFilter?: () => void;
  onSelectAllTools?: (tools: GpacLogTool[]) => void;
}

export const ToolSwitcher: React.FC<ToolSwitcherProps> = React.memo(
  ({
    currentTool,
    levelsByTool,
    defaultAllLevel,
    visibleLogsCount,
    logCountsByTool,
    visibleToolsFilter,
    onToolSelect,
    onClearFilter,
    onSelectAllTools,
  }) => {
    const configuredTools = React.useMemo(() => {
      const tools = new Set<GpacLogTool>();

      // Only add tools that have logs in buffers (ignore tools with 0 logs)
      Object.keys(logCountsByTool).forEach((tool) => {
        if (logCountsByTool[tool] > 0) {
          tools.add(tool as GpacLogTool);
        }
      });

      return Array.from(tools).sort();
    }, [logCountsByTool]);

    // Use configured tools directly, no need for "all" option
    const dropdownTools = configuredTools;

    // Memoize current display info
    const currentDisplayInfo = React.useMemo(() => {
      if (visibleToolsFilter.length > 0) {
        // ALL mode: show all tools
        return {
          label: 'ALL',
          effectiveLevel: '',
          bgColor: '#6b7280', // gray-500
          textColor: 'text-white',
        };
      }

      // Single tool mode (default)
      const effectiveLevel = getEffectiveLevel(
        currentTool,
        levelsByTool,
        defaultAllLevel,
      );
      const bgColor = LEVEL_COLORS[effectiveLevel];
      const textColor = bgToTextColor(bgColor);
      return {
        label: currentTool.toUpperCase(),
        effectiveLevel,
        bgColor,
        textColor,
      };
    }, [currentTool, levelsByTool, defaultAllLevel, visibleToolsFilter]);
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="px-0 py-0">
            <Badge
              variant="status"
              className={`text-xs cursor-pointer hover:opacity-80 transition-opacity active:border active:border-gray-500 `}
              title="Click to switch between configured tools"
            >
              {currentDisplayInfo.label}
              {currentDisplayInfo.effectiveLevel &&
                ` : ${currentDisplayInfo.effectiveLevel.toUpperCase()}`}{' '}
              ({visibleLogsCount})
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 bg-gray-950 max-h-80 overflow-y-auto border-transparent"
        >
          {/* ALL control at the top - only show if there are tools with logs */}
          {configuredTools.length > 0 && (
            <>
              <DropdownMenuItem
                className="flex items-center gap-2 py-1 px-2"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {/* ALL checkbox */}
                <Checkbox.Root
                  checked={visibleToolsFilter.length > 0}
                  onCheckedChange={() => {
                    if (visibleToolsFilter.length > 0) {
                      // ALL is currently checked, uncheck it -> switch to currentTool mode
                      onClearFilter?.();
                    } else {
                      // ALL is unchecked, check it -> show all
                      onSelectAllTools?.(configuredTools);
                    }
                  }}
                  className={`h-3 w-3 border rounded flex items-center justify-center ${
                    visibleToolsFilter.length > 0
                      ? 'bg-green-600 border-green-600'
                      : 'bg-gray-700 border-gray-600'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox.Indicator>
                    <FaCheck className="h-2 w-2 text-white" />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <span className="text-xs font-medium">ALL</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
            </>
          )}

          {/* Show tools with logs, or currentTool if no logs exist */}
          {configuredTools.length > 0
            ? dropdownTools.map((tool) => {
                const effectiveLevel = getEffectiveLevel(
                  tool,
                  levelsByTool,
                  defaultAllLevel,
                );
                const bgColor = LEVEL_COLORS[effectiveLevel];
                const textColor = bgToTextColor(bgColor);
                const isActive = tool === currentTool;
                const logCount = logCountsByTool[tool] || 0;
                const isCurrentTool = tool === currentTool;
                const isChecked = visibleToolsFilter.length > 0 || isCurrentTool;

                return (
                  <DropdownMenuItem
                    key={tool}
                    className={`flex items-center gap-2 py-1 px-2 ${
                      isActive ? 'bg-muted' : ''
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    {/* Checkbox - shows current tool or ALL state */}
                    <Checkbox.Root
                      checked={isChecked}
                      onCheckedChange={() => {
                        onToolSelect(tool); // Select this tool as current
                      }}
                      className={`h-3 w-3 border rounded flex items-center justify-center ${
                        isChecked
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-gray-700 border-gray-600'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox.Indicator>
                        <FaCheck className="h-2 w-2 text-white" />
                      </Checkbox.Indicator>
                    </Checkbox.Root>

                    {/* Tool name - clickable to select tool */}
                    <div
                      className="flex items-center justify-between flex-1 min-w-0 cursor-pointer"
                      onClick={() => onToolSelect(tool)}
                    >
                      <span className="font-normal text-xs truncate">
                        {tool.toUpperCase()}
                      </span>
                      <Badge
                        variant="status"
                        className={`text-xs ${textColor} ml-1`}
                        style={{ backgroundColor: bgColor }}
                      >
                        {effectiveLevel.toUpperCase()}({logCount})
                      </Badge>
                    </div>
                  </DropdownMenuItem>
                );
              })
            : /* If no logs, show only currentTool checkbox */
              (() => {
                const effectiveLevel = getEffectiveLevel(
                  currentTool,
                  levelsByTool,
                  defaultAllLevel,
                );
                const bgColor = LEVEL_COLORS[effectiveLevel];
                const textColor = bgToTextColor(bgColor);
                const logCount = logCountsByTool[currentTool] || 0;

                return (
                  <DropdownMenuItem
                    key={currentTool}
                    className="flex items-center gap-2 py-1 px-2 bg-muted"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    {/* Checkbox - always checked for currentTool */}
                    <Checkbox.Root
                      checked={true}
                      onCheckedChange={() => {}}
                      className="h-3 w-3 border rounded flex items-center justify-center bg-blue-600 border-blue-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox.Indicator>
                        <FaCheck className="h-2 w-2 text-white" />
                      </Checkbox.Indicator>
                    </Checkbox.Root>

                    {/* Tool name */}
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span className="font-normal text-xs truncate">
                        {currentTool.toUpperCase()}
                      </span>
                      <Badge
                        variant="status"
                        className={`text-xs ${textColor} ml-1`}
                        style={{ backgroundColor: bgColor }}
                      >
                        {effectiveLevel.toUpperCase()}({logCount})
                      </Badge>
                    </div>
                  </DropdownMenuItem>
                );
              })()
          }
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);
