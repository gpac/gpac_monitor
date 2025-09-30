import React, { useMemo } from 'react';
import { MdPushPin, MdOutlinePushPin } from 'react-icons/md';
import { GpacLogEntry } from '@/types/domain/gpac/log-types';
import { LogId } from '../utils/logIdentifier';
import { LOG_ENTRY_CONFIG } from '../utils/constants';

interface LogEntryItemProps {
  log: GpacLogEntry;
  logId: LogId;
  isHighlighted: boolean;
  onToggleHighlight: (logId: LogId | null) => void;
}

export const LogEntryItem = React.memo<LogEntryItemProps>(
  ({ log, logId, isHighlighted, onToggleHighlight }) => {
    const logData = useMemo(() => {
      const level = log.level;
      return {
        time: new Date(log.timestamp).toLocaleTimeString(),
        icon:
          LOG_ENTRY_CONFIG.icons[level as keyof typeof LOG_ENTRY_CONFIG.icons] ||
          LOG_ENTRY_CONFIG.icons[0],
        style:
          LOG_ENTRY_CONFIG.styles[level as keyof typeof LOG_ENTRY_CONFIG.styles] ||
          LOG_ENTRY_CONFIG.styles[0],
        name:
          LOG_ENTRY_CONFIG.names[level as keyof typeof LOG_ENTRY_CONFIG.names] ||
          'UNKNOWN',
      };
    }, [log.timestamp, log.level]);

    const [isHovered, setIsHovered] = React.useState(false);

    return (
      <div
        className={`
          flex items-start gap-2 mb-1 p-1 rounded
          ${isHighlighted ? 'border-l-4 border-yellow-500 bg-yellow-900/20' : ''}
          hover:bg-gray-800/30 transition-colors
        `}
        style={{ minHeight: '32px' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {logData.icon}
        <div className="flex-1 stat overflow-hidden">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400 shrink-0">{logData.time}</span>
            <span className={`shrink-0 ${logData.style}`}>
              [{logData.name}]
            </span>
            <span className="text-gray-300 shrink-0">[{log.tool}]</span>
          </div>
          <div className={`text-sm ${logData.style} break-words`}>
            {log.message}
          </div>
        </div>

        {/* Highlight button - visible on hover or when highlighted */}
        {(isHovered || isHighlighted) && (
          <button
            onClick={() => onToggleHighlight(isHighlighted ? null : logId)}
            className={`
              shrink-0 p-1 rounded transition-colors mt-1
              ${isHighlighted ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}
            `}
            title={isHighlighted ? 'Remove highlight' : 'Highlight this log'}
          >
            {isHighlighted ? (
              <MdPushPin className="w-4 h-4" />
            ) : (
              <MdOutlinePushPin className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.log.timestamp === nextProps.log.timestamp &&
      prevProps.log.message === nextProps.log.message &&
      prevProps.isHighlighted === nextProps.isHighlighted
    );
  },
);