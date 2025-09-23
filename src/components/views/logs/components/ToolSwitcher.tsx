import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GpacLogLevel, GpacLogTool } from '@/types/domain/gpac/log-types';
import { LEVEL_COLORS } from '../utils/constants';
import { bgToTextColor, getEffectiveLevel } from '../utils/toolUtils';
import { Button } from '@/components/ui/button';

interface ToolSwitcherProps {
  currentTool: GpacLogTool;
  levelsByTool: Record<GpacLogTool, GpacLogLevel>;
  defaultAllLevel: GpacLogLevel;
  visibleLogsCount: number;
  logCountsByTool: Record<string, number>;
  onToolSelect: (tool: GpacLogTool) => void;
}

export const ToolSwitcher: React.FC<ToolSwitcherProps> = React.memo(
  ({
    currentTool,
    levelsByTool,
    defaultAllLevel,
    visibleLogsCount,
    logCountsByTool,
    onToolSelect,
  }) => {
    const configuredTools = React.useMemo(() => {
      const tools = new Set<GpacLogTool>();

      // Add tools that have explicit levels set
      Object.keys(levelsByTool).forEach((tool) => {
        tools.add(tool as GpacLogTool);
      });

      // Add tools that have logs in buffers
      Object.keys(logCountsByTool).forEach((tool) => {
        if (logCountsByTool[tool] > 0) {
          tools.add(tool as GpacLogTool);
        }
      });

      return Array.from(tools).sort();
    }, [levelsByTool, logCountsByTool]);

    // Memoize current tool styles
    const currentToolStyles = React.useMemo(() => {
      const effectiveLevel = getEffectiveLevel(
        currentTool,
        levelsByTool,
        defaultAllLevel,
      );
      const bgColor = LEVEL_COLORS[effectiveLevel];
      const textColor = bgToTextColor(bgColor);
      return { effectiveLevel, bgColor, textColor };
    }, [currentTool, levelsByTool, defaultAllLevel]);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="px-0 py-0">
            <Badge
              variant="status"
              className={`text-xs cursor-pointer hover:opacity-80 transition-opacity ${currentToolStyles.textColor}`}
              style={{ backgroundColor: currentToolStyles.bgColor }}
              title="Click to switch between configured tools"
            >
              {currentTool.toUpperCase()} :{' '}
              {currentToolStyles.effectiveLevel.toUpperCase()} (
              {visibleLogsCount})
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-40 bg-gray-950 h-64 overflow-y-auto border-transparent"
        >
          {configuredTools.map((tool) => {
            const effectiveLevel = getEffectiveLevel(
              tool,
              levelsByTool,
              defaultAllLevel,
            );
            const bgColor = LEVEL_COLORS[effectiveLevel];
            const textColor = bgToTextColor(bgColor);
            const isActive = tool === currentTool;
            const logCount = logCountsByTool[tool] || 0;

            return (
              <DropdownMenuItem
                key={tool}
                onClick={() => onToolSelect(tool)}
                className={`flex items-center justify-between gap-1 py-1 ${
                  isActive ? 'bg-muted' : ''
                }`}
              >
                <div className="flex flex-col items-start min-w-0">
                  <span className="font-normal text-xs truncate">
                    {tool.toUpperCase()}
                  </span>
                </div>
                <Badge
                  variant="status"
                  className={`text-xs ${textColor} ml-1`}
                  style={{ backgroundColor: bgColor }}
                >
                  {effectiveLevel.toUpperCase()}({logCount})
                </Badge>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);
