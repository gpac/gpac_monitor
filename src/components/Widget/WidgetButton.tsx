import React from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { addWidget } from '@/shared/store/slices/widgetsSlice';
import { selectActiveWidgets } from '@/shared/store/selectors/widgets';
import { WidgetType } from '@/types/ui/widget';
import { IconType } from 'react-icons';
import { FiPlus, FiCheck } from 'react-icons/fi';

interface WidgetButtonProps {
  type: WidgetType;
  title: string;
  icon: IconType;
  defaultSize: { w: number; h: number };
}

export const WidgetButton: React.FC<WidgetButtonProps> = ({
  type,
  title,
  icon: Icon,
}) => {
  const dispatch = useAppDispatch();
  const activeWidgets = useAppSelector(selectActiveWidgets);

  // Vérifier si ce type de widget est déjà actif
  const isActive = activeWidgets.some((widget) => widget.type === type);

  const handleAddWidget = () => {
    dispatch(addWidget(type));
  };

  return (
    <button
      onClick={handleAddWidget}
      aria-label={`Add ${title} widget to dashboard`}
      className={`
      group w-full flex items-center justify-between p-3 rounded-lg
      transition-all duration-150 ease-out
      focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400/30

      ${
        isActive
          ? 'bg-monitor-panel ring-1 ring-emerald-400/25 text-emerald-400'
          : 'bg-monitor-panel text-monitor-text-secondary hover:bg-white/4'
      }
      }
    `}
    >
      <div className="flex items-center font-cond gap-3">
        <Icon
          className={`w-5 h-5
          ${
            isActive
              ? 'text-emerald-400'
              : 'text-monitor-text-muted group-hover:text-monitor-text-primary'
          }`}
        />
        <span
          className={`text-sm font-medium
          ${
            isActive
              ? 'text-monitor-text-primary'
              : 'text-monitor-text-secondary group-hover:text-monitor-text-primary'
          }`}
        >
          {title}
        </span>
      </div>

      <div className="flex items-center bg-monitor-surface gap-2">
        {isActive && (
          <div className="flex items-center gap-1 text-xs text-emerald-400">
            <FiCheck className="w-3 h-3" />
            <span className="hidden font-cond sm:inline">Active</span>
          </div>
        )}
        <FiPlus
          className={`w-4 h-4 transition-transform group-hover:scale-110
          ${isActive ? 'hidden' : 'text-slate-400 group-hover:text-slate-100'}
        `}
        />
      </div>
    </button>
  );
};
