import React from 'react';
import { useAppDispatch } from '@/shared/hooks/redux';
import { addWidget } from '@/shared/store/slices/widgetsSlice';
import { WidgetType } from '@/types/ui/widget';

import { LuGauge, LuVolume2, LuFileText, LuShare2 } from 'react-icons/lu';
import { FiLayout } from 'react-icons/fi';

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

  const handleAddWidget = (
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
  };

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
              <button
                key={widget.type}
                onClick={() => handleAddWidget(widget.type, widget.defaultSize)}
                className={`
                  group w-full flex items-center gap-3 p-3 rounded-xl
                  bg-gradient-to-r from-gray-800/50 to-gray-800/30
                  border border-gray-700/50
                  hover:border-blue-500/30 hover:bg-gradient-to-r hover:from-blue-600/10 hover:to-purple-600/10
                  focus:outline-none focus:ring-2 focus:ring-gray-300/50 focus:ring-offset-2 focus:ring-offset-gray-900
                  transition-all duration-200 ease-out
                  transform hover:translate-y-[-1px] hover:shadow-lg hover:shadow-blue-500/10
                  active:translate-y-0 active:scale-[0.98]
                `}
                aria-label={`Add ${widget.title} widget to dashboard`}
              >
                <div className="flex-shrink-0 p-1.5 rounded-lg bg-gray-700/50 group-hover:bg-blue-500/20 transition-colors duration-200">
                  <widget.icon className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors duration-200  " />
                </div>

                <div className="flex-1 text-left">
                  <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors duration-200">
                    {widget.title}
                  </span>
                </div>

                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <svg
                    className="w-4 h-4 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Layouts
          </h3>

          <div className="space-y-3">
            <button
              className={`
                w-full p-3 rounded-xl font-medium text-sm
                bg-gradient-to-r from-blue-600 to-blue-700
                hover:from-blue-500 hover:to-blue-600
                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900
                transition-all duration-200 ease-out
                transform hover:translate-y-[-1px] hover:shadow-lg hover:shadow-blue-500/25
                active:translate-y-0 active:scale-[0.98]
                text-white
              `}
              aria-label="Save current dashboard layout"
            >
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Save Current Layout
              </span>
            </button>

            <div className="relative">
              <select
                className={`
                  w-full p-3 pr-10 rounded-xl text-sm
                  bg-gray-800 border border-gray-700
                  hover:border-gray-600 focus:border-blue-500
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900
                  text-gray-200 cursor-pointer
                  transition-all duration-200
                  appearance-none
                `}
                aria-label="Load saved dashboard layout"
              >
                <option value="" className="bg-gray-800">
                  Load Layout...
                </option>
                <option value="default" className="bg-gray-800">
                  Default Layout
                </option>
                <option value="minimal" className="bg-gray-800">
                  Minimal Layout
                </option>
              </select>

              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
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
