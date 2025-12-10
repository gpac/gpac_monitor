import { ComponentType, memo } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { selectLogCounts } from '@/shared/store/selectors/headerSelectors';
import { addWidget } from '@/shared/store/slices/widgetsSlice';
import { selectActiveWidgets } from '@/shared/store/selectors/widgets';
import { setUIFilter } from '@/shared/store/slices/logsSlice';
import { WidgetType } from '@/types/ui/widget';
import { GpacLogLevel } from '@/types/domain/gpac/log-types';
import {
  FaTimesCircle,
  FaExclamationTriangle,
  FaInfoCircle,
} from 'react-icons/fa';
import { getWidgetDefinition } from '../Widget/registry';

interface LogCounterItemProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  count: number;
  colorClass: string;
  onOpen: () => void;
}

const LogCounterItem = memo<LogCounterItemProps>(
  ({ icon: Icon, label, count, colorClass, onOpen }) => {
    const hasCount = count > 0;

    return (
      <button
        onClick={onOpen}
        disabled={!hasCount}
        title={`${count} ${label} - Click to open logs monitor`}
        aria-label={`${count} ${label} - Click to open logs monitor`}
        className={`
          flex justify-between gap-2 px-3 py-1.5 rounded-md
          transition-all duration-150 ease-out font-ui text-sm
          ${
            hasCount
              ? 'hover:bg-gray-800/60 cursor-pointer'
              : 'opacity-50 cursor-not-allowed'
          }
        `}
      >
        <div className="flex  justify-center gap-2">
          <Icon
            className={`w-3.5 h-3.5 ${hasCount ? colorClass : 'text-gray-600'}`}
          />
        </div>
        <span
          className={`
          tabular-nums font-medium
          ${hasCount ? colorClass : 'text-gray-600'}
        `}
        >
          {count}
        </span>
      </button>
    );
  },
  (prevProps, nextProps) => prevProps.count === nextProps.count,
);

interface LogInfoButtonProps {
  count: number;
}

const LogInfoButton = memo<LogInfoButtonProps>(
  ({ count }) => {
    const dispatch = useAppDispatch();
    const activeWidgets = useAppSelector(selectActiveWidgets);
    const logWidgetExists = activeWidgets.some(
      (w) => w.type === WidgetType.LOGS,
    );

    const hasCount = count > 0;

    const handleOpen = () => {
      dispatch(setUIFilter([GpacLogLevel.INFO]));
      if (!logWidgetExists) {
        const definition = getWidgetDefinition(WidgetType.LOGS);
        if (definition) {
          dispatch(addWidget(WidgetType.LOGS));
        }
      }
    };

    return (
      <button
        onClick={handleOpen}
        title="Show info logs"
        aria-label="Show info logs"
        className="px-2 py-1.5 rounded-md hover:bg-gray-800/60 cursor-pointer transition-all duration-150 ease-out"
      >
        <FaInfoCircle
          className={`w-3.5 h-3.5 ${hasCount ? 'text-info' : 'text-gray-600'}`}
        />
      </button>
    );
  },
  (prevProps, nextProps) => prevProps.count === nextProps.count,
);

const LogCounters = () => {
  const dispatch = useAppDispatch();
  const logCounts = useAppSelector(selectLogCounts);
  const activeWidgets = useAppSelector(selectActiveWidgets);
  const logWidgetExists = activeWidgets.some((w) => w.type === WidgetType.LOGS);

  const handleOpenLogsFiltered = (level: GpacLogLevel) => {
    dispatch(setUIFilter([level]));
    if (!logWidgetExists) {
      const definition = getWidgetDefinition(WidgetType.LOGS);
      if (definition) {
        dispatch(addWidget(WidgetType.LOGS));
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted uppercase tracking-wider">
        Logs
      </span>
      <LogCounterItem
        icon={FaTimesCircle}
        label="Errors"
        count={logCounts.error}
        colorClass="text-danger"
        onOpen={() => handleOpenLogsFiltered(GpacLogLevel.ERROR)}
      />
      <LogCounterItem
        icon={FaExclamationTriangle}
        label="Warnings"
        count={logCounts.warning}
        colorClass="text-warning"
        onOpen={() => handleOpenLogsFiltered(GpacLogLevel.WARNING)}
      />
      <LogInfoButton count={logCounts.info} />
    </div>
  );
};

export default LogCounters;
