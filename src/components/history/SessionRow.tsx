import { memo } from 'react';
import { LuClapperboard, LuTriangleAlert } from 'react-icons/lu';
import { formatBytes, formatTimestamp } from '@/utils/formatting';
import type { SessionInfo } from '@/services/historyService/sessionFileReader/types';

interface SessionRowProps {
  session: SessionInfo;
  onSelect: (sessionId: string) => void;
  disabled: boolean;
}

const SessionRow = memo(({ session, onSelect, disabled }: SessionRowProps) => {
  const isValid = session.hasSnapshot && session.hasEvents;
  return (
    <button
      onClick={() => onSelect(session.sessionId)}
      disabled={disabled || !isValid}
      className="w-full flex items-center justify-between px-4 py-3 rounded-lg
        text-left transition-colors hover:bg-white/5 disabled:opacity-40
        disabled:cursor-not-allowed border border-transparent hover:border-white/10"
    >
      <div>
        <div className="text-sm text-white font-medium">
          {formatTimestamp(session.sessionId)}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {!session.hasSnapshot && (
            <span className="text-red-400">missing snapshot · </span>
          )}
          {!session.hasEvents && (
            <span className="text-red-400">missing events · </span>
          )}
          {!session.isComplete && (
            <span className="text-amber-400">incomplete · </span>
          )}
          {formatBytes(session.sizeBytes)}
        </div>
      </div>
      {session.isComplete ? (
        <LuClapperboard className="w-4 h-4 text-gray-500 shrink-0" />
      ) : (
        <LuTriangleAlert className="w-4 h-4 text-amber-400 shrink-0" />
      )}
    </button>
  );
});

export default SessionRow;
