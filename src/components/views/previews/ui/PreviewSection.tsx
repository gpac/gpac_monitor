import type { PreviewSourceGroup } from '@/shared/store/selectors/widgets';
import { PreviewRowContainer } from '../PreviewRowContainer';

interface PreviewSectionProps {
  title: string;
  groups: PreviewSourceGroup[];
  disabled: boolean;
}

export const PreviewSection = ({
  title,
  groups,
  disabled,
}: PreviewSectionProps) => (
  <section className="flex flex-col gap-1">
    <h3 className="px-2 text-[0.714rem] font-semibold uppercase tracking-wide text-monitor-text-muted">
      {title} ({groups.length})
    </h3>
    {groups.map((group) => (
      <div key={group.filterIdx} className="flex flex-col">
        <div className="px-2 py-0.5 text-xs text-monitor-text-secondary">
          {group.filterName} ({group.pids.length})
        </div>
        {group.pids.map((pid) => (
          <PreviewRowContainer
            key={`${pid.direction}-${pid.pidIdx}`}
            filterIdx={group.filterIdx}
            filterName={group.filterName}
            direction={pid.direction}
            pidIdx={pid.pidIdx}
            isOpen={pid.isOpen}
            disabled={disabled}
          />
        ))}
      </div>
    ))}
  </section>
);
