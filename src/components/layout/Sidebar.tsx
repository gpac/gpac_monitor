import React, {useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { addWidget } from '@/shared/store/slices/widgetsSlice';
import { selectLogCounts } from '@/shared/store/selectors/sidebarSelectors';
import { WidgetType } from '@/types/ui/widget';

import { LuGauge, LuVolume2, LuFileText, LuShare2 } from 'react-icons/lu';
import { FiLayout } from 'react-icons/fi';
import { FaInfoCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';

// Memoized log level configurations to avoid re-computation
const LOG_LEVEL_CONFIGS = {
  error: {
    icon: FaTimesCircle,
    label: 'Errors',
    baseClasses: 'group w-full flex items-center justify-between p-2 rounded-lg transition-opacity duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-gray-900',
    activeClasses: 'bg-red-900/30 border border-red-800/50 hover:bg-red-900/40',
    inactiveClasses: 'bg-gray-800/50 border border-gray-700/30 hover:bg-gray-800/70',
    iconActive: 'w-4 h-4 text-red-400',
    iconInactive: 'w-4 h-4 text-gray-400',
    textActive: 'text-sm font-medium text-red-200',
    textInactive: 'text-sm font-medium text-gray-300',
    badgeActive: 'text-sm font-bold px-2 py-1 rounded-md bg-red-800/50 text-red-200',
    badgeInactive: 'text-sm font-bold px-2 py-1 rounded-md bg-gray-700/50 text-gray-400',
  },
  warning: {
    icon: FaExclamationTriangle,
    label: 'Warnings',
    baseClasses: 'group w-full flex items-center justify-between p-2 rounded-lg transition-opacity duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:ring-offset-2 focus:ring-offset-gray-900',
    activeClasses: 'bg-yellow-900/30 border border-yellow-800/50 hover:bg-yellow-900/40',
    inactiveClasses: 'bg-gray-800/50 border border-gray-700/30 hover:bg-gray-800/70',
    iconActive: 'w-4 h-4 text-yellow-400',
    iconInactive: 'w-4 h-4 text-gray-400',
    textActive: 'text-sm font-medium text-yellow-200',
    textInactive: 'text-sm font-medium text-gray-300',
    badgeActive: 'text-sm font-bold px-2 py-1 rounded-md bg-yellow-800/50 text-yellow-200',
    badgeInactive: 'text-sm font-bold px-2 py-1 rounded-md bg-gray-700/50 text-gray-400',
  },
  info: {
    icon: FaInfoCircle,
    label: 'Info',
    baseClasses: 'group w-full flex items-center justify-between p-2 rounded-lg transition-opacity duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900',
    activeClasses: 'bg-blue-900/30 border border-blue-800/50 hover:bg-blue-900/40',
    inactiveClasses: 'bg-gray-800/50 border border-gray-700/30 hover:bg-gray-800/70',
    iconActive: 'w-4 h-4 text-green-700/60',
    iconInactive: 'w-4 h-4 text-gray-400',
    textActive: 'text-sm font-medium text-blue-200',
    textInactive: 'text-sm font-medium text-gray-300',
    badgeActive: 'text-sm font-bold px-2 py-1 rounded-md bg-blue-800/50 text-blue-200',
    badgeInactive: 'text-sm font-bold px-2 py-1 rounded-md bg-gray-700/50 text-gray-400',
  },
} as const;


const AvailableWidgetButton = React.memo(function AvailableWidgetButton({
  widget,
  onAdd
}: {
  widget: typeof availableWidgets[number],
  onAdd: (type: WidgetType, size: { w: number; h: number }) => void
}) {
  const Icon = widget.icon;
  return (
    <button
      onClick={() => onAdd(widget.type, widget.defaultSize)}
      className="group w-full flex items-center gap-3 p-3 rounded-xl border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-gray-300/50 focus:ring-offset-2 focus:ring-offset-gray-900 transition-opacity duration-150 ease-out active:translate-y-0 active:scale-[0.98]"
      aria-label={`Add ${widget.title} widget to dashboard`}
    >
      <div className="flex-shrink-0 p-1.5 rounded-lg bg-gray-700/50">
        <Icon className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors duration-200" />
      </div>
      <div className="flex-1 text-left">
        <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors duration-200">
          {widget.title}
        </span>
      </div>
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
    </button>
  );
});

// 2) Badge isolé (ne re-rend que quand le nombre bouge)
const CountBadge = React.memo(function CountBadge({
  count,
  active,
  classes
}: {
  count: number;
  active: boolean;
  classes: { active: string; inactive: string }
}) {
  return (
    <span className={active ? classes.active : classes.inactive}>
      {count}
    </span>
  );
});

const LogLevelButton = React.memo(function LogLevelButton({
  level,
  count,
  onOpen
}: {
  level: keyof typeof LOG_LEVEL_CONFIGS;
  count: number;
  onOpen: () => void
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
        <Icon className={hasCount ? config.iconActive : config.iconInactive} />
        <span className={hasCount ? config.textActive : config.textInactive}>
          {config.label}
        </span>
      </div>
      <CountBadge
        count={count}
        active={hasCount}
        classes={{ active: config.badgeActive, inactive: config.badgeInactive }}
      />
    </button>
  );
}, (prevProps, nextProps) => {
  // Optimisation : ne re-render que si le count change
  return prevProps.count === nextProps.count;
});



const availableWidgets = [
  {
    type: WidgetType.AUDIO,
    title: 'Audio Monitor',
    icon: LuVolume2,
    defaultSize: { w: 4, h: 4 },
  },

  {
    type: WidgetType.METRICS,
    title: 'System Metrics',
    icon: LuGauge,
    defaultSize: { w: 6, h: 4 },
  },
  {
    type: WidgetType.LOGS,
    title: 'System Logs',
    icon: LuFileText,
    defaultSize: { w: 4, h: 4 },
  },
  {
    type: WidgetType.GRAPH,
    title: 'Pipeline Graph',
    icon: LuShare2,
    defaultSize: { w: 6, h: 8 },
  },

  {
    type: WidgetType.MULTI_FILTER,
    title: 'Multi-Filter Monitor',
    icon: FiLayout,
    defaultSize: { w: 12, h: 4 },
  },
];

const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const logCounts = useAppSelector(selectLogCounts);

  // Memoize the widget creation callback to avoid re-renders
  const handleAddWidget = useCallback((
    type: WidgetType,
    defaultSize: { w: number; h: number },
  ) => {
    dispatch(
      addWidget({
        id: `${type}-${Date.now()}`,
        type,
        title: availableWidgets.find((w) => w.type === type)?.title || '',
        x: 0,
        y: 0,
        w: defaultSize.w,
        h: defaultSize.h,
        isResizable: true,
        isDraggable: true,
      }),
    );
  }, [dispatch]);


  

  return (
    <aside
      className="w-64 bg-gray-900 border-r border-gray-800 h-full flex flex-col"
      role="complementary"
      aria-label="Dashboard widgets sidebar"
    >
      <div className="p-6 pb-4 ">
        <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
          Dashboard
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Available Widgets
          </h3>

          <div className="space-y-3">
            {availableWidgets.map((widget) => (
              <AvailableWidgetButton
                key={widget.type}
                widget={widget}
                onAdd={handleAddWidget}
              />
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
            System Logs
          </h3>

          <div className="space-y-2">
            {Object.entries(logCounts).map(([level, count]) => (
              <LogLevelButton
                key={level}
                level={level as keyof typeof LOG_LEVEL_CONFIGS}
                count={count as number}
                onOpen={() => handleAddWidget(WidgetType.LOGS, { w: 5, h: 6 })}
              />
            ))}
          </div>
        </section>
      </div>

      <div className="p-6 pt-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 text-center">
          {availableWidgets.length} widgets available
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
