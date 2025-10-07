import { Button } from '@/components/ui/button';
import { LuPlay, LuPause } from 'react-icons/lu';
import { memo, useCallback } from 'react';

interface LiveToggleProps {
  isLive: boolean;
  onToggle: (isLive: boolean) => void;
  disabled?: boolean;
}

export const LiveToggle = memo<LiveToggleProps>(
  ({ isLive, onToggle, disabled = false }) => {
    const handleClick = useCallback(() => {
      onToggle(!isLive);
    }, [isLive, onToggle]);
    return (
      <Button
        variant={isLive ? 'outline' : 'destructive'}
        size="sm"
        onClick={handleClick}
        disabled={disabled}
        aria-pressed={isLive}
        className="flex items-center gap-2"
      >
        {isLive ? (
          <>
            <LuPause className="h-4 w-4" />
            <span>Pause</span>
          </>
        ) : (
          <>
            <LuPlay className="h-4 w-4" />
            <span>Live</span>
          </>
        )}
      </Button>
    );
  },
);
