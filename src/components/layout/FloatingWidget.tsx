import { memo, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { Widget } from '@/types/ui/widget';
import { useAppDispatch } from '@/shared/hooks/redux';
import {
  updateFloatingPosition,
  setWidgetZIndex,
} from '@/shared/store/slices/widgetsSlice';

interface FloatingWidgetProps {
  widget: Widget;
  children: React.ReactNode;
  maxZIndex: number;
}

const FloatingWidget = memo(
  ({ widget, children, maxZIndex }: FloatingWidgetProps) => {
    const dispatch = useAppDispatch();

    const handleDragStop = useCallback(
      (_e: any, d: { x: number; y: number }) => {
        dispatch(
          updateFloatingPosition({
            id: widget.id,
            x: d.x,
            y: d.y,
            width: widget.floatingWidth || 800,
            height: widget.floatingHeight || 600,
          }),
        );
      },
      [dispatch, widget.id, widget.floatingWidth, widget.floatingHeight],
    );

    const handleResizeStop = useCallback(
      (
        _e: any,
        _dir: any,
        ref: HTMLElement,
        _delta: any,
        position: { x: number; y: number },
      ) => {
        dispatch(
          updateFloatingPosition({
            id: widget.id,
            x: position.x,
            y: position.y,
            width: parseInt(ref.style.width),
            height: parseInt(ref.style.height),
          }),
        );
      },
      [dispatch, widget.id],
    );

    const handleBringToFront = useCallback(() => {
      dispatch(setWidgetZIndex({ id: widget.id, zIndex: maxZIndex + 1 }));
    }, [dispatch, widget.id, maxZIndex]);

    return (
      <Rnd
        position={{
          x: widget.floatingX || 100,
          y: widget.floatingY || 100,
        }}
        size={{
          width: widget.floatingWidth || 800,
          height: widget.floatingHeight || 600,
        }}
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
        onMouseDown={handleBringToFront}
        minWidth={400}
        minHeight={300}
        dragHandleClassName="widget-drag-handle"
        style={{
          zIndex: widget.zIndex || 1000,
        }}
      >
        {children}
      </Rnd>
    );
  },
);

FloatingWidget.displayName = 'FloatingWidget';

export default FloatingWidget;
