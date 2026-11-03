import React, { useMemo } from 'react';
import WidgetWrapper from '@/components/widget/WidgetWrapper';
import { useAppSelector } from '@/shared/hooks';
import { selectIsPreviewSupported } from '@/shared/store/selectors';
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
  const isPreviewSupported = useAppSelector(selectIsPreviewSupported);
  const activeGroups = useMemo(() => keepPids(sources, true), [sources]);
  const availableGroups = useMemo(() => keepPids(sources, false), [sources]);
  const activeCount = activeGroups.reduce(
    (count, group) => count + group.pids.length,
    0,
  );

  const statusBadge = useMemo(
    () => (
      <span className="text-[0.786rem] tabular-nums text-monitor-text-muted">
        {activeCount} active
      </span>
    ),
    [activeCount],
  );

  return (
    <WidgetWrapper id={id} statusBadge={statusBadge}>
      <div className="flex h-full flex-col gap-3 overflow-y-auto p-2 text-base">
        {sources.length === 0 ? (
          <p className="m-auto text-monitor-text-muted">
            {isPreviewSupported
              ? 'No video PID in this session'
              : 'Preview requires a newer GPAC version'}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <PreviewSection
              title="Active"
              count={activeCount}
              emptyLabel="No preview open"
              groups={activeGroups}
            />
            <PreviewSection
              title="Available"
              count={availableGroups.length}
              emptyLabel="No other previewable PID"
              groups={availableGroups}
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
