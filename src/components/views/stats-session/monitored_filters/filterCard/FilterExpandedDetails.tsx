import { memo } from 'react';
import { LuActivity } from 'react-icons/lu';
import { Progress } from '@/components/ui/progress';

interface FilterExpandedDetailsProps {
  nbIpid: number;
  nbOpid: number;
  formattedBytes: string;
  activityColor: string;
  activityLabel: string;
  bufferUsage: number;
  bufferColor: string;
  hasBufferInfo: boolean;
}

/**
 * Displays expanded filter details (I/O PIDs, data, activity, buffer)
 * Only renders when expansion state changes or when these specific values change
 */
export const FilterExpandedDetails = memo(
  ({
    nbIpid,
    nbOpid,
    formattedBytes,
    activityColor,
    activityLabel,
    bufferUsage,
    bufferColor,
    hasBufferInfo,
  }: FilterExpandedDetailsProps) => {
    return (
      <div className="space-y-2 pt-2 border-t border-monitor-line/30">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-xs mb-1 text-monitor-text-muted">
              <span>I/O PIDs</span>
            </div>
            <p className="text-xs font-medium tabular-nums text-monitor-text-secondary">
              {nbIpid || 0}/{nbOpid || 0}
            </p>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-xs text-monitor-text-muted mb-1">
              <span className="stat stat-label">Data</span>
            </div>
            <p className="text-xs font-medium tabular-nums text-monitor-text-secondary">
              {formattedBytes}
            </p>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-xs text-monitor-text-muted mb-1">
              <LuActivity className="h-3 w-3" />
              <span className="stat stat-label">Activity</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`h-2 w-2 rounded-full ${activityColor}`} />
              <span className="text-xs text-monitor-text-secondary">
                {activityLabel}
              </span>
            </div>
          </div>
        </div>

        {hasBufferInfo && (
          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-xs text-monitor-text-muted">
                Buffer usage
              </span>
              <span className="text-xs tabular-nums text-monitor-text-secondary">
                {bufferUsage}%
              </span>
            </div>
            <Progress
              value={bufferUsage}
              className="h-1.5"
              color={bufferColor}
            />
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.nbIpid === nextProps.nbIpid &&
      prevProps.nbOpid === nextProps.nbOpid &&
      prevProps.formattedBytes === nextProps.formattedBytes &&
      prevProps.activityColor === nextProps.activityColor &&
      prevProps.activityLabel === nextProps.activityLabel &&
      prevProps.bufferUsage === nextProps.bufferUsage &&
      prevProps.bufferColor === nextProps.bufferColor &&
      prevProps.hasBufferInfo === nextProps.hasBufferInfo
    );
  },
);

FilterExpandedDetails.displayName = 'FilterExpandedDetails';
