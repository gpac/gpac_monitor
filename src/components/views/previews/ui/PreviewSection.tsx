import * as Accordion from '@radix-ui/react-accordion';
import { LuChevronRight } from 'react-icons/lu';
import type { PreviewSourceGroup } from '@/shared/store/selectors/widgets';
import { PreviewRowContainer } from '../PreviewRowContainer';

const GROUP_HEADER_CLASS =
  'flex w-full min-w-0 items-center gap-1.5 rounded-sm bg-white/[0.04] px-2 py-1 text-left';

interface PreviewSectionProps {
  title: string;
  count: number;
  emptyLabel: string;
  groups: PreviewSourceGroup[];
  collapsible?: boolean;
}

const PreviewGroupRows = ({ group }: { group: PreviewSourceGroup }) => (
  <div className="ml-3.5 flex flex-col gap-px border-l border-monitor-line py-0.5 pl-1.5">
    {group.pids.map((pid) => (
      <PreviewRowContainer
        key={`${pid.direction}-${pid.pidIdx}`}
        filterIdx={group.filterIdx}
        filterName={group.filterName}
        direction={pid.direction}
        pidIdx={pid.pidIdx}
        isOpen={pid.isOpen}
      />
    ))}
  </div>
);

const PreviewGroupLabel = ({ group }: { group: PreviewSourceGroup }) => (
  <>
    <span
      className="min-w-0 truncate text-base font-medium text-monitor-text-primary"
      title={group.filterName}
    >
      {group.filterName}
    </span>
    <span className="shrink-0 font-mono text-xs tabular-nums text-monitor-text-muted">
      #{group.filterIdx}
    </span>
    <span className="ml-auto shrink-0 font-mono text-xs tabular-nums text-monitor-text-muted">
      {group.pids.length} {group.pids.length > 1 ? 'PIDs' : 'PID'}
    </span>
  </>
);

const CollapsibleGroups = ({ groups }: { groups: PreviewSourceGroup[] }) => (
  <Accordion.Root type="multiple" className="flex flex-col gap-1">
    {groups.map((group) => (
      <Accordion.Item
        key={group.filterIdx}
        value={String(group.filterIdx)}
        className="flex flex-col"
      >
        <Accordion.Header asChild>
          <div>
            <Accordion.Trigger
              className={`group ${GROUP_HEADER_CLASS} hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-monitor-active-filter`}
            >
              <LuChevronRight className="h-3 w-3 shrink-0 text-monitor-text-muted transition-transform group-data-[state=open]:rotate-90" />
              <PreviewGroupLabel group={group} />
            </Accordion.Trigger>
          </div>
        </Accordion.Header>
        <Accordion.Content className="flex flex-col">
          <PreviewGroupRows group={group} />
        </Accordion.Content>
      </Accordion.Item>
    ))}
  </Accordion.Root>
);

const ExpandedGroups = ({ groups }: { groups: PreviewSourceGroup[] }) => (
  <div className="flex flex-col gap-1">
    {groups.map((group) => (
      <div key={group.filterIdx} className="flex flex-col">
        <div className={GROUP_HEADER_CLASS}>
          <span className="h-3 w-3 shrink-0" aria-hidden />
          <PreviewGroupLabel group={group} />
        </div>
        <PreviewGroupRows group={group} />
      </div>
    ))}
  </div>
);

export const PreviewSection = ({
  title,
  count,
  emptyLabel,
  groups,
  collapsible = false,
}: PreviewSectionProps) => {
  const Groups = collapsible ? CollapsibleGroups : ExpandedGroups;
  return (
    <section className="flex flex-col gap-1">
      <h3 className="flex items-center justify-between px-2 text-[0.786rem] font-semibold uppercase tracking-wide text-monitor-text-muted">
        <span>{title}</span>
        <span className="tabular-nums">{count}</span>
      </h3>
      {groups.length > 0 ? (
        <Groups groups={groups} />
      ) : (
        <p className="px-2 py-1 text-[0.857rem] text-monitor-text-muted">
          {emptyLabel}
        </p>
      )}
    </section>
  );
};
