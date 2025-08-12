import { useEffect, useRef, useCallback } from 'react';
import {
  useResizeOptimization,
  ResizeNotification,
} from '@/utils/resizeManager';

interface UseOptimizedResizeOptions {
  onResize?: (width: number, height: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  debounce?: number;
  throttle?: boolean;
}

export const useOptimizedResize = (options: UseOptimizedResizeOptions = {}) => {
  const {
    onResize,
    onResizeStart,
    onResizeEnd,
    debounce = 16,
    throttle = true,
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const { observeElement, unobserveElement, subscribe } =
    useResizeOptimization();
  const isResizingRef = useRef(false);

  const handleResize = useCallback(
    (
      data: { width: number; height: number; timestamp: number },
      types?: ResizeNotification[],
    ) => {
      if (!types) return;

      if (types.includes('resize_start')) {
        isResizingRef.current = true;
        onResizeStart?.();
      }

      if (types.includes('resize_update') && onResize) {
        if (throttle && isResizingRef.current) {
          // Only call onResize during active resizing for better performance
          onResize(data.width, data.height);
        } else if (!throttle) {
          onResize(data.width, data.height);
        }
      }

      if (types.includes('resize_end')) {
        isResizingRef.current = false;
        onResizeEnd?.();
        // Final resize call to ensure accuracy
        if (onResize) {
          onResize(data.width, data.height);
        }
      }
    },
    [onResize, onResizeStart, onResizeEnd, throttle],
  );

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    const unsubscribe = subscribe(handleResize, debounce);

    return () => {
      unobserveElement(element);
      unsubscribe();
    };
  }, [observeElement, unobserveElement, subscribe, handleResize, debounce]);

  return {
    ref: elementRef,
    isResizing: isResizingRef.current,
  };
};
