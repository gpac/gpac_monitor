import { useMemo, useCallback, useRef } from 'react';
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
import { closeSidebar } from '@/shared/store/slices/layoutSlice';
import Header from './Header';
import Sidebar from '../Sidebar/Sidebar';
import { Widget } from '@/types/ui/widget';
import { getWidgetDefinition } from '../../Widget/registry';
import SidebarCloseButton from '../Sidebar/SidebarCloseButton';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardLayout = () => {
  const dispatch = useAppDispatch();
  const activeWidgets = useAppSelector((state) => state.widgets.activeWidgets);
  const configs = useAppSelector((state) => state.widgets.configs);
  const isSidebarOpen = useAppSelector((state) => state.layout.isSidebarOpen);
  const isDraggingRef = useRef(false);

  // Calculate rowHeight once based on available height
  // No state, no listeners, just initial calculation
  const rowHeight = useMemo(() => {
    const availableHeight = window.innerHeight - 64; // minus header
    // Divide by fewer rows to make widgets larger and fill space
    return Math.floor(availableHeight / 14.8);
  }, []);

  // Memoize layouts object - only recreate if widget positions/sizes change
  const layouts: RGLLayouts = useMemo(
    () => ({
      lg: activeWidgets.map((widget) => ({
        i: widget.id,
        x: widget.x,
        y: widget.y,
        w: widget.w,
        h: widget.h,
        minW: 2,
        minH: 2,
      })),
    }),
    [activeWidgets], // Only recreate when activeWidgets reference changes
  );

  const renderWidget = useCallback(
    (widget: Widget) => {
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
    },
    [configs],
  );

  return (
    <div className="h-screen bg-main">
      <div className="fixed top-0 left-0 right-0 h-16 z-20">
        <Header />
      </div>
      <div className="flex pt-8 h-[calc(100vh-4rem)]">
        <div
          id="app-sidebar"
          className="fixed top-16 bottom-0 left-0 w-72 z-10 bg-slate-800/95 transition-transform duration-300 ease-in-out will-change-transform"
          style={{
            transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          }}
        >
          <Sidebar />
        </div>
        {isSidebarOpen && (
          <SidebarCloseButton onClose={() => dispatch(closeSidebar())} />
        )}

        <main
          className="flex-1 h-full pb-4 pt-4 pl-0 transition-transform duration-300 will-change-transform"
          style={{
            transform: isSidebarOpen ? 'translateX(256px)' : 'translateX(0)',
            paddingRight: isSidebarOpen ? '272px' : '16px',
            opacity: isDraggingRef.current ? 0.2 : 1,
          }}
        >
          <ResponsiveGridLayout
            className="layout h-full"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 24, md: 24, sm: 12, xs: 6, xxs: 2 }}
            rowHeight={rowHeight}
            onDragStart={() => {
              isDraggingRef.current = true;
            }}
            onDragStop={(
              _layout: Layout[],
              _oldItem: Layout,
              newItem: Layout,
            ) => {
              isDraggingRef.current = false;
              dispatch(
                updateWidgetPosition({
                  id: newItem.i,
                  x: newItem.x,
                  y: newItem.y,
                  w: newItem.w,
                  h: newItem.h,
                }),
              );
            }}
            onResizeStart={() => {
              isDraggingRef.current = true;
            }}
            onResizeStop={(
              _layout: Layout[],
              _oldItem: Layout,
              newItem: Layout,
            ) => {
              isDraggingRef.current = false;
              dispatch(
                updateWidgetPosition({
                  id: newItem.i,
                  x: newItem.x,
                  y: newItem.y,
                  w: newItem.w,
                  h: newItem.h,
                }),
              );
            }}
            isDraggable={true}
            isResizable={true}
            margin={[16, 16]}
            containerPadding={[16, 16]}
            draggableCancel=".no-drag"
            useCSSTransforms={true}
          >
            {activeWidgets.map(renderWidget)}
          </ResponsiveGridLayout>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
