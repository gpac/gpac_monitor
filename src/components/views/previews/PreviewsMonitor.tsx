import React, { useMemo } from 'react';
import WidgetWrapper from '@/components/widget/WidgetWrapper';
import { useAppSelector } from '@/shared/hooks';
import { useDataMode } from '@/shared/hooks/data/useDataMode';
import {
  selectPreviewSources,
  type PreviewSourceGroup,
} from '@/shared/store/selectors/widgets';
import { PreviewSection } from './ui/PreviewSection';

const keepPids = (
  groups: PreviewSourceGroup[],
  isOpen: boolean,
): PreviewSourceGroup[] =>
  groups.flatMap((group) => {
    const pids = group.pids.filter((pid) => pid.isOpen === isOpen);
    return pids.length > 0 ? [{ ...group, pids }] : [];
  });

const PreviewsMonitor = React.memo(({ id }: { id: string }) => {
  const sources = useAppSelector(selectPreviewSources);
  const { isHistory } = useDataMode();
  const activeGroups = useMemo(() => keepPids(sources, true), [sources]);
  const availableGroups = useMemo(() => keepPids(sources, false), [sources]);
  const activeCount = activeGroups.reduce(
    (count, group) => count + group.pids.length,
    0,
  );

  const statusBadge = useMemo(
    () => (
      <div className="flex items-center gap-1.5 text-[0.714rem]">
        <span className="text-monitor-text-muted">{activeCount} active</span>
        <span className="rounded border border-emerald-700/50 bg-emerald-900/40 px-1.5 text-emerald-300"></span>
      </div>
    ),
    [activeCount],
  );

  return (
    <WidgetWrapper id={id} statusBadge={statusBadge}>
      <div className="flex h-full flex-col gap-3 overflow-y-auto p-2 text-base">
        {isHistory && (
          <p className="px-2 text-xs text-monitor-text-muted">
            Preview is available in live mode only
          </p>
        )}
        {sources.length === 0 ? (
          <p className="m-auto text-monitor-text-muted">
            No video PID in this session
          </p>
        ) : (
          <div
            className={`flex flex-col gap-3 ${isHistory ? 'opacity-50' : ''}`}
          >
            <PreviewSection
              title="Active"
              groups={activeGroups}
              disabled={isHistory}
            />
            <PreviewSection
              title="Available"
              groups={availableGroups}
              disabled={isHistory}
              collapsible
            />
          </div>
        )}
      </div>
    </WidgetWrapper>
  );
});

PreviewsMonitor.displayName = 'PreviewsMonitor';

export default PreviewsMonitor;
