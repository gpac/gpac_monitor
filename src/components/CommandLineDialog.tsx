import { useState } from 'react';
import { LuInfo, LuCopy, LuCheck } from 'react-icons/lu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CustomTooltip } from '@/components/ui/tooltip';
import { useCommandLine } from '@/shared/hooks/useCommandLine';

export const CommandLineInfo = () => {
  const { commandLine, isLoading } = useCommandLine();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (commandLine) {
      navigator.clipboard.writeText(commandLine);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Popover>
      <CustomTooltip content="Show GPAC command line">
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-monitor-text-muted hover:text-monitor-text-primary"
          >
            <LuInfo className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
      </CustomTooltip>
      <PopoverContent
        className="w-[600px] max-w-[90vw] bg-monitor-panel border-monitor-line p-3"
        align="end"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-monitor-text-muted">
              Command Line
            </span>
            {!isLoading && commandLine && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="h-6 px-2"
              >
                {copied ? (
                  <LuCheck className="h-3 w-3 text-emerald-400" />
                ) : (
                  <LuCopy className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
          {isLoading ? (
            <div className="text-monitor-text-muted text-xs">Loading...</div>
          ) : commandLine ? (
            <pre className="bg-black/40 p-2 rounded text-xs text-monitor-text-secondary overflow-x-auto font-mono border border-monitor-line/50">
              {commandLine}
            </pre>
          ) : (
            <div className="text-monitor-text-muted text-xs">Not available</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
