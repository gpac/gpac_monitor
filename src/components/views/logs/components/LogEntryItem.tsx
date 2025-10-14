import React, { useMemo, useCallback, useState } from 'react';
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
      const IconComponent =
        LOG_ENTRY_CONFIG.iconComponents[
          level as keyof typeof LOG_ENTRY_CONFIG.iconComponents
        ] || LOG_ENTRY_CONFIG.iconComponents[0];
      const iconClass =
        LOG_ENTRY_CONFIG.iconClasses[
          level as keyof typeof LOG_ENTRY_CONFIG.iconClasses
        ] || LOG_ENTRY_CONFIG.iconClasses[0];

      return {
        time: new Date(log.timestamp).toLocaleTimeString(),
        IconComponent,
        iconClass,
        style:
          LOG_ENTRY_CONFIG.styles[
            level as keyof typeof LOG_ENTRY_CONFIG.styles
          ] || LOG_ENTRY_CONFIG.styles[0],
        name:
          LOG_ENTRY_CONFIG.names[
            level as keyof typeof LOG_ENTRY_CONFIG.names
          ] || 'UNKNOWN',
      };
    }, [log.timestamp, log.level]);

    const [isHovered, setIsHovered] = useState(false);

    // Memoize hover handlers to prevent re-renders
    const handleMouseEnter = useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsHovered(false), []);

    // Memoize click handler
    const handleToggle = useCallback(() => {
      onToggleHighlight(isHighlighted ? null : logId);
    }, [onToggleHighlight, isHighlighted, logId]);

    // Pre-compute CSS classes to avoid string concatenation on each render
    const containerClass = useMemo(() => {
      const baseClasses = 'flex items-start gap-2 mb-1 p-1 rounded hover:bg-gray-800/30 transition-colors cursor-pointer';
      const highlightClasses = isHighlighted ? ' border-l-4 border-yellow-500 bg-yellow-900/70' : '';
      return baseClasses + highlightClasses;
    }, [isHighlighted]);

    const buttonClass = useMemo(() => {
      const baseClasses = 'shrink-0 p-1 rounded transition-colors mt-1';
      const colorClasses = isHighlighted ? ' text-yellow-500' : ' text-gray-400 hover:text-yellow-500';
      return baseClasses + colorClasses;
    }, [isHighlighted]);

    return (
      <div
        className={containerClass}
        style={{ minHeight: '32px' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleToggle}
      >
        <logData.IconComponent className={logData.iconClass} />
        <div className="flex-1 stat overflow-hidden font-mono">
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

        {/* Highlight icon - visible on hover or when highlighted */}
        {(isHovered || isHighlighted) && (
          <div className={buttonClass}>
            {isHighlighted ? (
              <MdPushPin className="w-4 h-4" />
            ) : (
              <MdOutlinePushPin className="w-4 h-4" />
            )}
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if these specific props change
    return (
      prevProps.log.timestamp === nextProps.log.timestamp &&
      prevProps.log.message === nextProps.log.message &&
      prevProps.log.level === nextProps.log.level &&
      prevProps.isHighlighted === nextProps.isHighlighted &&
      prevProps.logId === nextProps.logId
    );
  },
);
