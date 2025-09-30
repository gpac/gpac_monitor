import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import * as Checkbox from '@radix-ui/react-checkbox';
import { FaCheck } from 'react-icons/fa';
import { GpacLogLevel, GpacLogTool } from '@/types/domain/gpac/log-types';
import { LEVEL_COLORS } from '../utils/constants';
import { bgToTextColor, getEffectiveLevel } from '../utils/toolUtils';

interface ToolSwitcherItemProps {
  tool: GpacLogTool;
  levelsByTool: Record<GpacLogTool, GpacLogLevel>;
  defaultAllLevel: GpacLogLevel;
  logCountsByTool: Record<string, number>;
  currentTool: GpacLogTool;
  isChecked: boolean;
  onToggle: () => void;
  onToolSelect: (tool: GpacLogTool) => void;
}

export const ToolSwitcherItem: React.FC<ToolSwitcherItemProps> = React.memo(
  ({
    tool,
    levelsByTool,
    defaultAllLevel,
    logCountsByTool,
    currentTool,
    isChecked,
    onToggle,
    onToolSelect,
  }) => {
    const effectiveLevel = getEffectiveLevel(tool, levelsByTool, defaultAllLevel);
    const bgColor = LEVEL_COLORS[effectiveLevel];
    const textColor = bgToTextColor(bgColor);
    const isActive = tool === currentTool;
    const logCount = logCountsByTool[tool] || 0;

    return (
      <DropdownMenuItem
        className={`flex items-center gap-2 py-1 px-2 ${isActive ? 'bg-muted' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Checkbox.Root
          checked={isChecked}
          onCheckedChange={onToggle}
          className={`h-3 w-3 border rounded flex items-center justify-center ${
            isChecked ? 'bg-blue-600 border-blue-600' : 'bg-gray-700 border-gray-600'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox.Indicator>
            <FaCheck className="h-2 w-2 text-white" />
          </Checkbox.Indicator>
        </Checkbox.Root>

        <div
          className="flex items-center justify-between flex-1 min-w-0 cursor-pointer"
          onClick={() => onToolSelect(tool)}
        >
          <span className="font-normal text-xs truncate">{tool.toUpperCase()}</span>
          <Badge variant="status" className={`text-xs ${textColor} ml-1`} style={{ backgroundColor: bgColor }}>
            {effectiveLevel.toUpperCase()}({logCount})
          </Badge>
        </div>
      </DropdownMenuItem>
    );
  },
);