import { useState, useEffect, type RefObject } from 'react';

export const useContainerSize = (ref: RefObject<HTMLElement>) => {
  const [size, setSize] = useState({ width: 400, height: 160 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      setSize({ width: width || 400, height: height || 160 });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return size;
};
