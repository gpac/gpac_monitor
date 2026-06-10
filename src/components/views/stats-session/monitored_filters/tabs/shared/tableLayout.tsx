import { type ReactNode } from 'react';
import { CustomTooltip } from '@/components/ui/tooltip';
import { TAB_STYLES } from '../styles';

export const MetricRow = ({
  label,
  value,
  valueClassName = 'text-info',
  title,
  infoIcon,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  title?: string;
  infoIcon?: ReactNode;
}) => (
  <tr className="bg-monitor-panel border-b border-transparent">
    <td className="px-2 py-2 align-middle text-xs text-muted-foreground">
      {infoIcon} {label}
    </td>
    <td
      className={`px-2 py-2 align-middle text-xs font-medium tabular-nums text-right w-28 whitespace-nowrap ${valueClassName}`}
    >
      {title ? (
        <CustomTooltip content={title}>
          <span>{value}</span>
        </CustomTooltip>
      ) : (
        value
      )}
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
        <tr className="bg-white/5 border-b border-transparent">
          <th colSpan={2} className={TAB_STYLES.TABLE_HEADER}>
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
