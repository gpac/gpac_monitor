import React from 'react';
import { useAppSelector, useAppDispatch } from '@/shared/hooks/redux';
import {
  Responsive,
  WidthProvider,
  Layout,
  Layouts as RGLLayouts,
} from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { updateWidgetPosition } from '@/shared/store/slices/widgetsSlice';
import { openSidebar } from '@/shared/store/slices/layoutSlice';
import { LuChevronRight } from 'react-icons/lu';
import Header from './Header';
import Sidebar from './Sidebar';
import { Widget } from '../../types/ui/widget';
import { getWidgetDefinition } from '../Widget/registry';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const activeWidgets = useAppSelector((state) => state.widgets.activeWidgets);
  const configs = useAppSelector((state) => state.widgets.configs);
  const isSidebarOpen = useAppSelector((state) => state.layout.isSidebarOpen);

  // Force grid recalculation after sidebar transition
  React.useLayoutEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 320); // Match transition duration
    return () => clearTimeout(timer);
  }, [isSidebarOpen]);

  const layouts: RGLLayouts = {
    lg: activeWidgets.map((widget) => ({
      i: widget.id,
      x: widget.x,
      y: widget.y,
      w: widget.w,
      h: widget.h,
      minW: 2,
      minH: 2,
    })),
  };

  const renderWidget = (widget: Widget) => {
    const definition = getWidgetDefinition(widget.type);

    if (!definition) {
      console.warn(`No definition found for widget type: ${widget.type}`);
      return null;
    }

    const Component = definition.component;

    return (
      <div key={widget.id}>
        <Component
          id={widget.id}
          config={
            configs[widget.id] || {
              isMaximized: false,
              isMinimized: false,
              settings: {},
            }
          }
          isDetached={widget.isDetached}
          detachedFilterIdx={widget.detachedFilterIdx}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header fixe en haut */}
      <div className="fixed top-0 left-0 right-0 h-16 z-20">
        <Header />
      </div>

      <div className="flex pt-16">
        {/* Sidebar with dynamic width and slide transition */}
        <div
          className={`fixed top-16 bottom-0 z-10 bg-gray-800 transition-all duration-300 ease-in-out ${
            isSidebarOpen ? 'left-0 w-64' : 'w-0 -left-64'
          }`}
        >
          {isSidebarOpen && <Sidebar />}
        </div>

        {/* Floating button to open sidebar when closed */}
        {!isSidebarOpen && (
          <button
            onClick={() => dispatch(openSidebar())}
            className="fixed left-4 top-20 z-20 bg-gray-700 hover:bg-gray-600 p-2 rounded-md transition-colors shadow-lg"
            aria-label="Open sidebar"
            title="Open properties sidebar"
          >
            <LuChevronRight className="w-5 h-5 text-slate-200" />
          </button>
        )}

        <main
          className={`flex-1 transition-all duration-300 ease-in-out ${
            isSidebarOpen ? 'pl-64' : 'pl-0'
          } p-6`}
        >
          {/* Grid widgets */}
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 24, md: 24, sm: 12, xs: 6, xxs: 2 }} // ← ici
            rowHeight={60}
            onLayoutChange={(currentLayout: Layout[]) => {
              currentLayout.forEach((item: Layout) => {
                dispatch(
                  updateWidgetPosition({
                    id: item.i,
                    x: item.x,
                    y: item.y,
                    w: item.w,
                    h: item.h,
                  }),
                );
              });
            }}
            isDraggable={true}
            isResizable={true}
            margin={[16, 16]}
            containerPadding={[16, 16]}
            draggableCancel=".no-drag"
          >
            {activeWidgets.map(renderWidget)}
          </ResponsiveGridLayout>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
