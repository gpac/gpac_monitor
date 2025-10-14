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
      }),
    );
  };

  return (
    <button
      onClick={handleAddWidget}
      aria-label={`Add ${title} widget to dashboard`}
      className={`
      group w-full flex items-center justify-between p-3 rounded-lg
      transition-all duration-150 ease-out
      focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-2 focus:ring-offset-black

      ${
        isActive
          ? 'bg-slate-800. border text-emerald-500 shadow-[inset_0_0_0_1px_rgba(16,185,129,.25)]'
          : 'bg-slate-950/60 border border-slate-700/40 hover:bg-slate-800/80 hover:border-slate-500/50'
      }
    `}
    >
      <div className="flex items-center font-cond gap-3">
        <Icon
          className={`w-5 h-5
          ${
            isActive
              ? 'text-emerald-400' // accent clair = état actif évident
              : 'text-slate-300 group-hover:text-slate-100' /* meilleur contraste qu’un gray-400 */
          }`}
        />
        <span
          className={`text-sm font-medium
          ${
            isActive
              ? 'text-slate-100'
              : 'text-slate-300 group-hover:text-slate-100'
          }`}
        >
          {title}
        </span>
      </div>

      <div className="flex items-center gap-2">
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
