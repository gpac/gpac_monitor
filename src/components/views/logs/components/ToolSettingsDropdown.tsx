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

interface ToolSettingsDropdownProps {
  levelsByTool: Record<GpacLogTool, GpacLogLevel>;
  defaultAllLevel: GpacLogLevel;
  currentTool: GpacLogTool;
  onToolLevelChange: (tool: GpacLogTool, level: GpacLogLevel) => void;
  onDefaultAllLevelChange: (level: GpacLogLevel) => void;
  onToolNavigate?: (tool: GpacLogTool) => void;
}

const TOOL_DISPLAY_NAMES: Record<GpacLogTool, string> = {

  [GpacLogTool.AUDIO]: 'Audio',
  [GpacLogTool.CACHE]: 'Cache',
  [GpacLogTool.CODEC]: 'Codec',
  [GpacLogTool.CODING]: 'Coding',
  [GpacLogTool.COMPOSE]: 'Compose',
  [GpacLogTool.CONSOLE]: 'Console',
  [GpacLogTool.CONTAINER]: 'Container',
  [GpacLogTool.CORE]: 'Core',
  [GpacLogTool.CTIME]: 'CTime',
  [GpacLogTool.DASH]: 'DASH',
  [GpacLogTool.FILTER]: 'Filter',
  [GpacLogTool.HTTP]: 'HTTP',
  [GpacLogTool.INTERACT]: 'Interact',
  [GpacLogTool.MEDIA]: 'Media',
  [GpacLogTool.MEM]: 'Mem',
  [GpacLogTool.MMIO]: 'MMIO',
  [GpacLogTool.MODULE]: 'Module',
  [GpacLogTool.MUTEX]: 'Mutex',
  [GpacLogTool.NETWORK]: 'Network',
  [GpacLogTool.PARSER]: 'Parser',
  [GpacLogTool.RMTWS]: 'RemoteWS',
  [GpacLogTool.ROUTE]: 'Route',
  [GpacLogTool.RTI]: 'RTI',
  [GpacLogTool.RTP]: 'RTP',
  [GpacLogTool.SCENE]: 'Scene',
  [GpacLogTool.SCHED]: 'Sched',
  [GpacLogTool.SCRIPT]: 'Script',
  [GpacLogTool.ALL]: 'All',
};

const LEVEL_COLORS: Record<GpacLogLevel, string> = {
  [GpacLogLevel.QUIET]: 'bg-gray-500',
  [GpacLogLevel.ERROR]: 'bg-red-600',
  [GpacLogLevel.WARNING]: 'bg-yellow-600',
  [GpacLogLevel.INFO]: 'bg-green-700',
  [GpacLogLevel.DEBUG]: 'bg-blue-400',
};

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

  const getEffectiveLevel = (tool: GpacLogTool): GpacLogLevel => {
    return tool === GpacLogTool.ALL
      ? defaultAllLevel
      : (levelsByTool[tool] ?? defaultAllLevel);
  };

  const sortedTools = Object.values(GpacLogTool).sort((a, b) => {
    // ALL first, then alphabetical
    if (a === GpacLogTool.ALL) return -1;
    if (b === GpacLogTool.ALL) return 1;

    const nameA = TOOL_DISPLAY_NAMES[a];
    const nameB = TOOL_DISPLAY_NAMES[b];

    // Safety check for undefined values
    if (!nameA && !nameB) return 0;
    if (!nameA) return 1;
    if (!nameB) return -1;

    return nameA.localeCompare(nameB);
  });

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
            const effectiveLevel = getEffectiveLevel(tool);
            const isCurrentTool = tool === currentTool;
            return (
              <div key={tool} className="flex items-center justify-between py-2 px-3">
                <span
                  className={`font-medium mr-2 cursor-pointer w-1/3 rounded-lg hover:bg-gray-600 hover:text-blue-200 transition-colors duration-200 ${
                    isCurrentTool ? 'text-black bg-gray-400' : ''
                  }`}
                  onClick={() => onToolNavigate?.(tool)}
                >
                  {TOOL_DISPLAY_NAMES[tool]}
                </span>
                
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="p-0 h-auto">
                    <Badge
                      variant="secondary"
                      className={`text-white text-xs cursor-pointer hover:opacity-80 ${LEVEL_COLORS[effectiveLevel]}`}
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