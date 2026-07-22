import { memo } from 'react';
import { useAppSelector } from '@/shared/hooks/redux';
import { selectLogCounts } from '@/shared/store/selectors/header/headerSelectors';
import { GpacLogLevel } from '@/types/domain/gpac/log-types';
import {
  FaTimesCircle,
  FaExclamationTriangle,
  FaInfoCircle,
} from 'react-icons/fa';
import { LogShortcutButton } from '@/shared/ui/LogShortcutButton';
import { useOpenLogsWidget } from '@/shared/hooks/ui/useOpenLogsWidget';
import { ThreadFilterDropdown } from './ThreadFilterDropdown';

const LOG_SHORTCUTS = [
  {
    key: 'errors',
    title: 'Show error logs',
    level: GpacLogLevel.ERROR,
    icon: FaTimesCircle,
    colorClass: 'text-danger',
  },
  {
    key: 'warnings',
    title: 'Show warning logs',
    level: GpacLogLevel.WARNING,
    icon: FaExclamationTriangle,
    colorClass: 'text-warning',
  },
  {
    key: 'info',
    title: 'Show info logs',
    level: GpacLogLevel.INFO,
    icon: FaInfoCircle,
    colorClass: 'text-info',
  },
] as const;

const LogCounters = memo(() => {
  const logCounts = useAppSelector(selectLogCounts);
  const openLogsWidget = useOpenLogsWidget();

  const countByKey = {
    errors: logCounts.error,
    warnings: logCounts.warning,
    info: logCounts.info,
  } as const;

return (
  <div className="flex items-center gap-2 min-w-0 overflow-hidden">
    <span className="text-xs font-medium text-muted uppercase tracking-wider shrink-0">
      Logs
    </span>

    {LOG_SHORTCUTS.map((shortcut) => (
      <LogShortcutButton
        key={shortcut.key}
        icon={shortcut.icon}
        title={`${countByKey[shortcut.key]} - ${shortcut.title}`}
        count={countByKey[shortcut.key]}
        colorClass={shortcut.colorClass}
        onClick={() => openLogsWidget({ levels: [shortcut.level] })}
      />
    ))}

    <div className="h-4 w-px bg-gray-700 shrink-0" />

    <div className="min-w-0 flex-1 overflow-hidden">
      <ThreadFilterDropdown />
    </div>
  </div>
);
});

LogCounters.displayName = 'LogCounters';

export default LogCounters;
