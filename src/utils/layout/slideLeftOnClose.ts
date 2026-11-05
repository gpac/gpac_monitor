import { Layout } from 'react-grid-layout';
import { compact } from 'react-grid-layout/build/utils';
import { sharesRows } from './rowWidthShare';

const slideRightOfClosed = (layout: Layout[], closedItem: Layout): Layout[] => {
  const slidLayout = layout.map((item) => ({ ...item }));

  slidLayout
    .filter((item) => item.x >= closedItem.x && sharesRows(closedItem, item))
    .sort((first, second) => first.x - second.x)
    .forEach((item) => {
      item.x = slidLayout
        .filter(
          (other) =>
            other !== item && other.x < item.x && sharesRows(item, other),
        )
        .reduce((limit, other) => Math.max(limit, other.x + other.w), 0);
    });

  return slidLayout;
};

export const slideLeftOnClose = (
  layout: Layout[],
  closedItemId: string,
  columns: number,
): Layout[] => {
  const compactedLayout = compact(layout, 'vertical', columns);
  const closedItem = compactedLayout.find((item) => item.i === closedItemId);
  if (!closedItem) return compactedLayout;

  const remainingItems = compactedLayout.filter(
    (item) => item.i !== closedItemId,
  );
  const firstPass = slideRightOfClosed(remainingItems, closedItem);
  const secondPass = slideRightOfClosed(
    compact(firstPass, 'vertical', columns),
    closedItem,
  );

  return compact(secondPass, 'vertical', columns);
};
