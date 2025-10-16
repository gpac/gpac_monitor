import React from 'react';
import LogCounters from './LogCounters';
import PropertiesPanel from './PropertiesPanel';

// Memoized log level configurations to avoid re-computation
/* const LOG_LEVEL_CONFIGS = {
  error: {
    icon: FaTimesCircle,
    label: 'Errors',
    baseClasses:
      'group w-full flex items-center justify-between p-2 rounded-lg transition-opacity duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-gray-900',
    activeClasses: 'bg-red-900/30 border border-red-800/50 hover:bg-red-900/40',
    inactiveClasses:
      'bg-gray-800/50 border border-gray-700/30 hover:bg-gray-800/70',
    iconActive: 'w-4 h-4 text-red-400',
    iconInactive: 'w-4 h-4 text-gray-400',
    textActive: 'text-sm font-medium text-red-200',
    textInactive: 'text-sm font-medium text-gray-300',
    badgeActive:
      'text-sm font-bold px-2 py-1 rounded-md bg-red-800/50 text-red-200',
    badgeInactive:
      'text-sm font-bold px-2 py-1 rounded-md bg-gray-700/50 text-gray-400',
  },
  warning: {
    icon: FaExclamationTriangle,
    label: 'Warnings',
    baseClasses:
      'group w-full flex items-center justify-between p-2 rounded-lg transition-opacity duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:ring-offset-2 focus:ring-offset-gray-900',
    activeClasses:
      'bg-yellow-900/30 border border-yellow-800/50 hover:bg-yellow-900/40',
    inactiveClasses:
      'bg-gray-800/50 border border-gray-700/30 hover:bg-gray-800/70',
    iconActive: 'w-4 h-4 text-yellow-400',
    iconInactive: 'w-4 h-4 text-gray-400',
    textActive: 'text-sm font-medium text-yellow-200',
    textInactive: 'text-sm font-medium text-gray-300',
    badgeActive:
      'text-sm font-bold px-2 py-1 rounded-md bg-yellow-800/50 text-yellow-200',
    badgeInactive:
      'text-sm font-bold px-2 py-1 rounded-md bg-gray-700/50 text-gray-400',
  },
  info: {
    icon: FaInfoCircle,
    label: 'Info',
    baseClasses:
      'group w-full flex items-center justify-between p-2 rounded-lg transition-opacity duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900',
    activeClasses:
      'bg-blue-900/30 border border-blue-800/50 hover:bg-blue-900/40',
    inactiveClasses:
      'bg-gray-800/50 border border-gray-700/30 hover:bg-gray-800/70',
    iconActive: 'w-4 h-4 text-green-700/60',
    iconInactive: 'w-4 h-4 text-gray-400',
    textActive: 'text-sm font-medium text-blue-200',
    textInactive: 'text-sm font-medium text-gray-300',
    badgeActive:
      'text-sm font-bold px-2 py-1 rounded-md bg-blue-800/50 text-blue-200',
    badgeInactive:
      'text-sm font-bold px-2 py-1 rounded-md bg-gray-700/50 text-gray-400',
  },
} as const;
 */
/*
const CountBadge = React.memo(function CountBadge({
  count,
  active,
  classes,
}: {
  count: number;
  active: boolean;
  classes: { active: string; inactive: string };
}) {
  return (
    <span className={active ? classes.active : classes.inactive}>{count}</span>
  );
}); */

/* const LogLevelButton = React.memo(
  function LogLevelButton({
    level,
    count,
    onOpen,
  }: {
    level: keyof typeof LOG_LEVEL_CONFIGS;
    count: number;
    onOpen: () => void;
  }) {
    const config = LOG_LEVEL_CONFIGS[level];
    const Icon = config.icon;
    const hasCount = count > 0;

    return (
      <button
        onClick={onOpen}
        disabled={!hasCount}
        className={`${config.baseClasses} ${hasCount ? config.activeClasses : config.inactiveClasses}`}
        aria-label={`${count} ${config.label.toLowerCase()} - Click to open logs monitor`}
      >
        <div className="flex items-center gap-2">
          <Icon
            className={hasCount ? config.iconActive : config.iconInactive}
          />
          <span className={hasCount ? config.textActive : config.textInactive}>
            {config.label}
          </span>
        </div>
        <CountBadge
          count={count}
          active={hasCount}
          classes={{
            active: config.badgeActive,
            inactive: config.badgeInactive,
          }}
        />
      </button>
    );
  },
  (prevProps, nextProps) => {
    // Optimisation : ne re-render que si le count change
    return prevProps.count === nextProps.count;
  },
);
 */

const Sidebar: React.FC = () => {
  // Create a Set of active widget types for fast lookup

  return (
    <aside
      className="w-64 bg-gray-900 border-r border-gray-800 h-full flex flex-col"
      role="complementary"
      aria-label="Dashboard widgets sidebar"
    >
      <div className="p-4">
        <div className="text-xs font-medium text-muted mb-2 uppercase tracking-wider">
          Logs Monitor
        </div>
        <LogCounters />
      </div>

      {/* Separator */}
      <div className="w-full h-px bg-gray-700 my-2" />

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <PropertiesPanel />
      </div>
    </aside>
  );
};

export default Sidebar;
