import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GpacLogLevel } from '@/types/domain/gpac/log-types';

interface LevelSelectionDialogProps {
  isOpen: boolean;
  toolName: string;
  currentLevel: GpacLogLevel;
  onLevelSelect: (level: GpacLogLevel) => void;
  onClose: () => void;
}

const LOG_LEVELS: Array<{
  level: GpacLogLevel;
  label: string;
  description: string;
  color: string;
}> = [
  {
    level: GpacLogLevel.QUIET,
    label: 'Quiet',
    description: 'No output (silent)',
    color: 'bg-gray-500',
  },
  {
    level: GpacLogLevel.ERROR,
    label: 'Error',
    description: 'Critical errors only',
    color: 'bg-red-600',
  },
  {
    level: GpacLogLevel.WARNING,
    label: 'Warning',
    description: 'Errors and warnings',
    color: 'bg-yellow-700',
  },
  {
    level: GpacLogLevel.INFO,
    label: 'Info',
    description: 'Errors, warnings, and info',
    color: 'bg-blue-700',
  },
  {
    level: GpacLogLevel.DEBUG,
    label: 'Debug',
    description: 'All messages (most verbose)',
    color: 'bg-blue-400',
  },
];

export function LevelSelectionDialog({
  isOpen,
  toolName,
  currentLevel,
  onLevelSelect,
  onClose,
}: LevelSelectionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-secondary ">
        <DialogHeader>
          <DialogTitle>Set Log Level</DialogTitle>
          <DialogDescription>
            Choose the log level for <strong>{toolName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4 ">
          {LOG_LEVELS.map(({ level, label, description, color }) => (
            <Button
              key={level}
              variant={currentLevel === level ? 'default' : 'outline'}
              className="w-full justify-between h-auto p-4"
              onClick={() => onLevelSelect(level)}
            >
              <div className="flex items-center space-x-3">
                <Badge
                  variant="secondary"
                  className={`text-white text-xs px-2 ${color}`}
                >
                  {label.toUpperCase()}
                </Badge>
                <div className="text-left">
                  <div className="font-medium">{label}</div>
                  <div className="text-sm text-muted-foreground">
                    {description}
                  </div>
                </div>
              </div>
              {currentLevel === level && (
                <div className="text-xs text-muted-foreground">Current</div>
              )}
            </Button>
          ))}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
