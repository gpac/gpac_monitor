import { ReactNode } from 'react';
import { Resizable, ResizeCallbackData } from 'react-resizable';
import { TIMELINE_DOCK_HEIGHT_PX } from '../historyLayout';
import { renderVerticalResizeHandle } from './resizeHandles';

interface HistoryTimelineDockShellProps {
  dockHeight: number;
  maxDockHeight: number;
  onResize: (height: number) => void;
  header?: ReactNode;
  timeline?: ReactNode;
  detail?: ReactNode;
  minimap?: ReactNode;
}

const HistoryTimelineDockShell = ({
  dockHeight,
  maxDockHeight,
  onResize,
  header,
  timeline,
  detail,
  minimap,
}: HistoryTimelineDockShellProps) => {
  return (
    <div className="relative" style={{ height: TIMELINE_DOCK_HEIGHT_PX }}>
      <Resizable
        axis="y"
        width={0}
        height={dockHeight}
        resizeHandles={['n']}
        minConstraints={[0, TIMELINE_DOCK_HEIGHT_PX]}
        maxConstraints={[0, maxDockHeight]}
        handle={renderVerticalResizeHandle}
        onResize={(_event, { size }: ResizeCallbackData) =>
          onResize(size.height)
        }
      >
        <div
          className="z-50 flex flex-col border-t border-t-timeline-premium bg-gradient-to-b from-monitor-timeline-premiumFrom to-monitor-timeline-premiumTo"
          style={{
            height: dockHeight,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          {header && (
            <div
              className="shrink-0"
              style={{ height: TIMELINE_DOCK_HEIGHT_PX }}
            >
              {header}
            </div>
          )}
          <div className="flex-1 flex flex-row items-stretch min-h-0">
            <div className="flex-1 flex flex-col min-w-0">
              {timeline && <div className="flex-1 min-h-0">{timeline}</div>}
              {minimap && <div className="shrink-0">{minimap}</div>}
            </div>
            {detail && (
              <div className="shrink-0 border-l border-history-border">
                {detail}
              </div>
            )}
          </div>
        </div>
      </Resizable>
    </div>
  );
};

export default HistoryTimelineDockShell;
