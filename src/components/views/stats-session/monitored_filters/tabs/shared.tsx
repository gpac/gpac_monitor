import { type ReactNode } from 'react';

export const MetricRow = ({
  label,
  value,
  isEven,
  valueClassName = 'text-info',
}: {
  label: string;
  value: string;
  isEven: boolean;
  valueClassName?: string;
}) => (
  <tr
    className={`${isEven ? 'bg-black/10' : 'bg-black/20'} border-b border-white/5`}
  >
    <td className="px-2 py-2 align-middle text-xs text-muted-foreground">
      {label}
    </td>
    <td
      className={`px-2 py-2 align-middle text-xs font-medium tabular-nums text-right w-28 whitespace-nowrap ${valueClassName}`}
    >
      {value}
    </td>
  </tr>
);

export const TableSection = ({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: ReactNode;
  children: ReactNode;
}) => (
  <div className="bg-monitor-app">
    <table className="w-full text-left table-fixed">
      <colgroup>
        <col />
        <col className="w-28" />
      </colgroup>
      <thead>
        <tr className="bg-monitor-panel border-b border-white/10">
          <th
            colSpan={2}
            className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide"
          >
            <div className="flex items-center justify-between">
              <span>{title}</span>
              {badge}
            </div>
          </th>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);
