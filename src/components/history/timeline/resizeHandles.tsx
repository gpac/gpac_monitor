// react-resizable handle renderers, kept separate so both the dock (vertical)
// and the events panel (horizontal) resize the same way.

export const renderVerticalResizeHandle = (
  _resizeHandleAxis: string,
  ref: React.Ref<HTMLDivElement>,
) => (
  <div
    ref={ref}
    className="absolute -top-1 left-0 right-0 z-30 h-2 cursor-ns-resize hover:bg-history-muted"
  />
);

export const renderHorizontalResizeHandle = (
  _resizeHandleAxis: string,
  ref: React.Ref<HTMLDivElement>,
) => (
  <div
    ref={ref}
    className="z-30 w-2 cursor-ew-resize hover:bg-history-muted"
    style={{ position: 'absolute', top: 0, bottom: 0, right: -4 }}
  />
);
