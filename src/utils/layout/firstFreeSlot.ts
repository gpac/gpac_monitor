import { Layout } from 'react-grid-layout';
import { compact } from 'react-grid-layout/build/utils';

export interface FirstFreeSlot {
  x: number;
  y: number;
  compactedLayout: Layout[];
}

const overlaps = (
  item: Layout,
  x: number,
  y: number,
  width: number,
  height: number,
): boolean =>
  item.x < x + width &&
  x < item.x + item.w &&
  item.y < y + height &&
  y < item.y + item.h;

export const findFirstFreeSlot = (
  layout: Layout[],
  width: number,
  height: number,
  columns: number,
): FirstFreeSlot => {
  const compactedLayout = compact(layout, 'vertical', columns);
  const bottom = compactedLayout.reduce(
    (lowest, item) => Math.max(lowest, item.y + item.h),
    0,
  );

  for (let y = 0; y < bottom; y++) {
    for (let x = 0; x + width <= columns; x++) {
      const isFree = !compactedLayout.some((item) =>
        overlaps(item, x, y, width, height),
      );
      if (isFree) return { x, y, compactedLayout };
    }
  }

  return { x: 0, y: bottom, compactedLayout };
};
