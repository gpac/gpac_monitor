import * as Accordion from '@radix-ui/react-accordion';
import { LuChevronRight } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import type { PreviewSourceGroup } from '@/shared/store/selectors/widgets';
import { PreviewRowContainer } from '../PreviewRowContainer';

interface PreviewSectionProps {
  title: string;
  groups: PreviewSourceGroup[];
  disabled: boolean;
  collapsible?: boolean;
}

interface PreviewGroupProps {
  group: PreviewSourceGroup;
  disabled: boolean;
}

const PreviewGroupRows = ({ group, disabled }: PreviewGroupProps) => (
  <>
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
  </>
);

const PreviewGroupLabel = ({ group }: { group: PreviewSourceGroup }) => (
  <span className="flex min-w-0 items-center gap-1.5">
    <Badge
      variant="status"
      className="min-w-0 rounded-[6px] border border-slate-600/40 bg-slate-800/60 px-2 text-[0.929rem] font-medium text-slate-200 shadow-none hover:bg-slate-800/60"
    >
      <span className="truncate">{group.filterName}</span>
    </Badge>
    <span className="shrink-0 text-xs tabular-nums text-monitor-text-muted">
      {group.pids.length}
    </span>
  </span>
);

const CollapsibleGroups = ({
  groups,
  disabled,
}: Omit<PreviewSectionProps, 'title'>) => (
  <Accordion.Root type="multiple" disabled={disabled} className="flex flex-col">
    {groups.map((group) => (
      <Accordion.Item
        key={group.filterIdx}
        value={String(group.filterIdx)}
        className="flex flex-col"
      >
        <Accordion.Header asChild>
          <div>
            <Accordion.Trigger className="group flex w-full items-center gap-1 rounded px-2 py-0.5 text-left text-sm text-monitor-text-secondary hover:text-monitor-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:hover:text-monitor-text-secondary">
              <LuChevronRight className="h-3 w-3 shrink-0 transition-transform group-data-[state=open]:rotate-90" />
              <PreviewGroupLabel group={group} />
            </Accordion.Trigger>
          </div>
        </Accordion.Header>
        <Accordion.Content className="flex flex-col">
          <PreviewGroupRows group={group} disabled={disabled} />
        </Accordion.Content>
      </Accordion.Item>
    ))}
  </Accordion.Root>
);

export const PreviewSection = ({
  title,
  groups,
  disabled,
  collapsible = false,
}: PreviewSectionProps) => (
  <section className="flex flex-col gap-1">
    <h3 className="px-2 text-xs font-semibold uppercase tracking-wide text-monitor-text-muted">
      {title} ({groups.length})
    </h3>
    {collapsible ? (
      <CollapsibleGroups groups={groups} disabled={disabled} />
    ) : (
      groups.map((group) => (
        <div key={group.filterIdx} className="flex flex-col">
          <div className="px-2 py-0.5 text-sm text-monitor-text-secondary">
            <PreviewGroupLabel group={group} />
          </div>
          <PreviewGroupRows group={group} disabled={disabled} />
        </div>
      ))
    )}
  </section>
);
