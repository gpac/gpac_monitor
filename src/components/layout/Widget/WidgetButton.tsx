import React from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { addWidget } from '@/shared/store/slices/widgetsSlice';
import { selectActiveWidgets } from '@/shared/store/slices/widgetsSlice';
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
  defaultSize,
}) => {
  const dispatch = useAppDispatch();
  const activeWidgets = useAppSelector(selectActiveWidgets);

  // Vérifier si ce type de widget est déjà actif
  const isActive = activeWidgets.some((widget) => widget.type === type);

  const handleAddWidget = () => {
    dispatch(
      addWidget({
        id: `${type}-${Date.now()}`,
        type,
        title,
        x: 0,
        y: 0,
        w: defaultSize.w,
        h: defaultSize.h,
        isResizable: true,
        isDraggable: true,
      })
    );
  };

  return (
    <button
      onClick={handleAddWidget}
      className={`
        w-full flex items-center justify-between p-3 rounded-lg
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900
        ${
          isActive
            ? 'bg-gray-700/30 border border-blue-800/50 hover:bg-blue-900/40'
            : 'bg-gray-950/50 border border-gray-700/30 hover:bg-gray-800/70 hover:border-gray-600/50'
        }
      `}
      aria-label={`Add ${title} widget to dashboard`}
    >
      <div className="flex items-center font-cond gap-3">
        <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
        <span className={`text-sm font-medium ${isActive ? 'text-blue-200' : 'text-gray-300'}`}>
          {title}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {isActive && (
          <div className="flex items-center gap-1 text-xs text-green-400">
            <FiCheck className="w-3 h-3" />
            <span className="hidden font-cond sm:inline">Active</span>
          </div>
        )}
        <FiPlus
          className={`w-4 h-4 transition-transform group-hover:scale-110 ${
            isActive ? 'hidden' : 'text-gray-500'
          }`}
        />
      </div>
    </button>
  );
};
