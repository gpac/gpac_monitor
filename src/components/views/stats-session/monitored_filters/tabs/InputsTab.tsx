import { memo, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/utils/formatting';
import { getOverallStatus, getPIDStatusBadge } from '@/utils/gpac';
import { getMediaTypeInfo } from '@/utils/gpac';
import { FaCircleInfo } from 'react-icons/fa6';
import { useSidebar } from '@/shared/hooks/useSidebar';
import type { InputCardProps, InputsTabProps, PIDWithIndex } from '../../types';
import { useInputsTabData } from './hooks/useInputsTabData';

// Compact navigation item for quick access
interface InputNavItemProps {
  inputName: string;
  pidsByType: Record<string, PIDWithIndex[]>;
  filterIdx: number;
}

const InputNavItem = memo(
  ({ inputName, pidsByType, filterIdx }: InputNavItemProps) => {
    const { openPIDProps } = useSidebar();

    // Memoize expensive calculations
    const { firstPid, mediaTypes } = useMemo(() => {
      const pids = Object.values(pidsByType).flat();

      return {
        firstPid: pids[0],
        mediaTypes: Object.keys(pidsByType),
      };
    }, [pidsByType]);

    // Memoize click handler to avoid re-creating on each render
    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (firstPid) {
          openPIDProps({ filterIdx, ipidIdx: firstPid.ipidIdx });
        }
      },
      [firstPid, filterIdx, openPIDProps],
    );

    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 hover:bg-background/70 transition-colors">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-sm  font-medium truncate">{inputName}</span>
          <div className="flex items-center gap-2">
            {mediaTypes.map((type) => {
              const mediaInfo = getMediaTypeInfo(type);
              const MediaIcon = mediaInfo.icon;
              return (
                <MediaIcon
                  key={type}
                  className={`h-3 w-3 ${mediaInfo.color}`}
                  title={mediaInfo.label}
                />
              );
            })}
          </div>
          <FaCircleInfo
            className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
            onClick={handleClick}
            title={`View ${inputName} properties`}
          />
        </div>
      </div>
    );
  },
);

InputNavItem.displayName = 'InputNavItem';

const InputCard = memo(
  ({ inputName, pidsByType, filterIdx }: InputCardProps) => {
    const { openPIDProps } = useSidebar();
    const allPids = Object.values(pidsByType).flat();
    const overallStatus = getOverallStatus(allPids);
    const StatusIcon = overallStatus.icon;

    // Render media section for any type
    const renderMediaSection = (pids: PIDWithIndex[], type: string) => {
      return (
        <div className="space-y-3">
          {pids.map((pid) => {
            const statusBadge = getPIDStatusBadge(pid);

            return (
              <div key={pid.name} className="bg-background/50 rounded-lg p-3">
                {/* PID Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{pid.name}</span>
                    {pid.codec && (
                      <Badge variant="outline" className="text-xs">
                        {pid.codec.toUpperCase()}
                      </Badge>
                    )}
                    <FaCircleInfo
                      className="h-3.5 w-3.5 cursor-pointer text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => {
                        openPIDProps({
                          filterIdx,
                          ipidIdx: pid.ipidIdx,
                        });
                      }}
                      title={`View ${pid.name} properties`}
                    />
                  </div>
                  {statusBadge && (
                    <Badge variant={statusBadge.variant} className="text-xs">
                      {statusBadge.text}
                    </Badge>
                  )}
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-sm po-medium text-info tabular-nums">
                      {formatBytes(pid.buffer)}
                    </div>
                    <div className="text-xs text-muted-foreground">Buffer</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-info tabular-nums">
                      {pid.bitrate || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Bitrate</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-info tabular-nums">
                      {type.toLowerCase() === 'visual' &&
                      pid.width &&
                      pid.height
                        ? `${pid.width}x${pid.height}`
                        : type.toLowerCase() === 'audio' && pid.channels
                          ? `${pid.channels}ch`
                          : pid.nb_pck_queued || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {type.toLowerCase() === 'visual' &&
                      pid.width &&
                      pid.height
                        ? 'Resolution'
                        : type.toLowerCase() === 'audio' && pid.channels
                          ? 'Channels'
                          : 'Queued'}
                    </div>
                  </div>
                </div>

                {/* Additional info for specific media types */}
                {type.toLowerCase() === 'audio' && pid.samplerate && (
                  <div className="mt-2 text-center">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      Sample Rate: {(pid.samplerate / 1000).toFixed(1)} kHz
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <Card className="bg-stat border-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <StatusIcon className="h-4 w-4" />
              {inputName}
            </CardTitle>
            <Badge variant={overallStatus.variant}>
              {overallStatus.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(pidsByType).length > 0 ? (
            <div
              className={`grid gap-4 ${Object.keys(pidsByType).length > 1 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}
            >
              {Object.entries(pidsByType).map(([type, pids]) => {
                const mediaInfo = getMediaTypeInfo(type);
                const MediaIcon = mediaInfo.icon;

                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <MediaIcon className={`h-4 w-4 ${mediaInfo.color}`} />
                      <span className="text-sm font-medium">
                        {mediaInfo.label}
                      </span>
                    </div>
                    {renderMediaSection(pids, type)}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No streams available
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
);

InputCard.displayName = 'InputCard';

const InputsTab = memo(({ filterData, filterName }: InputsTabProps) => {
  const { inputPidsWithIndices, groupedInputs, inputNames, globalStatus } =
    useInputsTabData(filterData);

  return (
    <div className="space-y-4">
      {/* Global Status Bar */}
      {inputPidsWithIndices.length > 0 && (
        <div className="bg-background/30 border-transparent rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Global Status</span>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-info tabular-nums">
                  {globalStatus.totalPids} Input
                  {globalStatus.totalPids > 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {globalStatus.errors > 0 && (
                <Badge variant="destructive" className="text-xs tabular-nums">
                  {globalStatus.errors} Error
                  {globalStatus.errors > 1 ? 's' : ''}
                </Badge>
              )}
              {globalStatus.active > 0 && (
                <Badge variant="default" className="text-xs tabular-nums">
                  {globalStatus.active} Active
                </Badge>
              )}
              {globalStatus.eos > 0 && (
                <Badge variant="secondary" className="text-xs tabular-nums">
                  {globalStatus.eos} EOS
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Access Navigation - Only show when multiple inputs */}
      {inputNames.length > 1 && (
        <div className="bg-stat  border-transparent rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {inputNames.length} inputs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
            {inputNames.map((inputName) => (
              <InputNavItem
                key={inputName}
                inputName={inputName}
                pidsByType={groupedInputs[inputName]}
                filterIdx={filterData.idx}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inputs Grid */}
      {inputNames.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {inputNames.map((inputName) => (
            <InputCard
              key={inputName}
              inputName={inputName}
              pidsByType={groupedInputs[inputName]}
              filterIdx={filterData.idx}
            />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground stat-label">
          <div className="flex flex-col items-center gap-2">
            <span>No input PIDs available for {filterName}</span>
          </div>
        </div>
      )}
    </div>
  );
});

InputsTab.displayName = 'InputsTab';

export default InputsTab;
