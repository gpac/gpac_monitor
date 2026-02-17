import React, { useMemo, memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GraphFilterData } from '@/types/domain/gpac';
import { determineFilterSessionType } from '../../utils/filterType';
import { useGraphColors } from '../../hooks/layout/useGraphColors';
import { getBasename, truncateMiddle } from '../../utils/labelUtils';
import NodeToolbarActions from './NodeToolbarActions';

interface CustomNodeProps extends NodeProps {
  data: GraphFilterData & {
    label: string;
    filterType: string;
    isStalled?: boolean;
  } & Record<string, unknown>;
}

const CustomNodeBase: React.FC<CustomNodeProps> = ({
  data,
  selected,
  ...nodeProps
}) => {
  const { label, ipid, opid, nb_ipid, nb_opid } = data;
  const alerts = data.alerts as { errors: number; warnings: number } | null;
  const sessionType = useMemo(() => determineFilterSessionType(data), [data]);
  const node = useMemo(
    () => ({
      data,
      position: { x: 0, y: 0 },
      ...nodeProps,
    }),
    [data, nodeProps],
  );

  // Compute display label (basename + truncate)
  const { fullLabel, displayLabel } = useMemo(() => {
    const full = label;
    const base = getBasename(full);
    const display = truncateMiddle(base, 26);
    return { fullLabel: full, displayLabel: display };
  }, [label]);

  // Helper to format PID labels
  const formatPidLabel = (pidId: string): string => {
    const base = getBasename(pidId);
    return truncateMiddle(base, 18);
  };

  const [textColor, backgroundColor] = useGraphColors(node);
  const isMonitored = data.isMonitored;
  const borderClass = isMonitored
    ? 'ring-4 ring-red-700/90'
    : selected
      ? 'ring-2 ring-sky-400'
      : 'ring-1 ring-monitor-line';

  // Create input handles only if nb_ipid > 0
  const inputHandles =
    nb_ipid > 0
      ? Object.keys(ipid).map((pidId, index) => ({
          id: pidId,
          type: 'target' as const,
          position: Position.Left,
          index,
        }))
      : [];

  // Create output handles only if nb_opid > 0
  const outputHandles =
    nb_opid > 0
      ? Object.keys(opid).map((pidId, index) => ({
          id: pidId,
          type: 'source' as const,
          position: Position.Right,
          index,
        }))
      : [];

  const getHandleY = (index: number, total: number): string => {
    if (total === 1) return '50%';
    return `${(index / (total - 1)) * 100}%`;
  };
  // Memoize style objects
  const containerStyle = useMemo(
    () => ({
      borderColor: backgroundColor,
      backgroundColor: backgroundColor + '40',
      borderWidth: '2px',
    }),
    [backgroundColor],
  );

  const headerStyle = useMemo(
    () => ({
      backgroundColor,
    }),
    [backgroundColor],
  );

  const handleStyle = useMemo(
    () => ({
      background: backgroundColor,
      width: '10px',
      height: '10px',
      border: '2px solid white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }),
    [backgroundColor],
  );

  const textStyle = useMemo(
    () => ({
      color: textColor,
    }),
    [textColor],
  );

  return (
    <>
      <NodeToolbarActions filterIdx={data.idx} filterName={data.name} />
      <div
        className={`
          border-2 rounded-md p-4 
          ${borderClass}
        `}
        style={containerStyle}
      >
        {inputHandles.map(({ id, type, position, index }) => (
          <Handle
            key={`input-${id}`}
            id={id}
            type={type}
            position={position}
            style={{
              ...handleStyle,
              top: getHandleY(index, inputHandles.length),
              transform: 'translateY(-50%)',
            }}
          />
        ))}

        <div
          className="rounded-t-xl -m-4 mb-2 px-4 py-3 shadow-sm"
          style={headerStyle}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h3
                className="font-bold text-sm truncate"
                style={textStyle}
                title={fullLabel}
              >
                {displayLabel}
              </h3>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span
                className="text-xs font-medium px-2 py-1 bg-white/60 rounded-full"
                style={textStyle}
                title={
                  sessionType === 'source'
                    ? 'Source Filter'
                    : sessionType === 'sink'
                      ? 'Sink Filter'
                      : 'Processing Filter'
                }
              >
                {sessionType.toUpperCase()}
              </span>
              {alerts?.errors ? (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 bg-red-600 text-white rounded-full"
                  title={`${alerts.errors} error(s)`}
                >
                  {alerts.errors} ERR
                </span>
              ) : null}
              {alerts?.warnings ? (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-500 text-white rounded-full"
                  title={`${alerts.warnings} warning(s)`}
                >
                  {alerts.warnings} WARN
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Node content */}
        <div className="node-drag-handle ">
          <div className="flex justify-between items-start mb-2">
            {/* INPUTS on the left */}
            <div className="flex-1 text-xs text-gray-600 pr-2">
              {nb_ipid > 0 && (
                <>
                  <span className="font-medium text-white block text-left">
                    INPUTS
                  </span>
                  <div className="mt-1">
                    {Object.keys(ipid).map((pidId) => (
                      <div
                        key={pidId}
                        className="text-xs text-gray-100 truncate"
                        title={pidId}
                      >
                        {formatPidLabel(pidId)}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* OUTPUTS on the right */}
            <div className="flex-1 text-xs text-gray-800 pl-2">
              {nb_opid > 0 && (
                <>
                  <span className="font-medium text-white block text-right">
                    OUTPUTS
                  </span>
                  <div className="mt-1">
                    {Object.keys(opid).map((pidId) => (
                      <div
                        key={pidId}
                        className="text-xs text-gray-100 text-right truncate"
                        title={pidId}
                      >
                        {formatPidLabel(pidId)}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="text-xs text-gray-100 pt-2 border-t border-gray-300 text-center">
            IPIDs: {nb_ipid} | OPIDs: {nb_opid}
          </div>
        </div>

        {/* Output handles */}
        {outputHandles.map(({ id, type, position, index }) => (
          <Handle
            key={`output-${id}`}
            id={id}
            type={type}
            position={position}
            style={{
              ...handleStyle,
              top: getHandleY(index, outputHandles.length),
              transform: 'translateY(-50%)',
            }}
          />
        ))}
      </div>
    </>
  );
};
const CustomNode = memo(CustomNodeBase, (prevProps, nextProps) => {
  return (
    prevProps.data.idx === nextProps.data.idx &&
    prevProps.data.name === nextProps.data.name &&
    prevProps.data.nb_ipid === nextProps.data.nb_ipid &&
    prevProps.data.nb_opid === nextProps.data.nb_opid &&
    prevProps.selected === nextProps.selected &&
    prevProps.data.isMonitored === nextProps.data.isMonitored &&
    prevProps.data.isStalled === nextProps.data.isStalled &&
    prevProps.data.alerts === nextProps.data.alerts &&
    JSON.stringify(prevProps.data.ipid) ===
      JSON.stringify(nextProps.data.ipid) &&
    JSON.stringify(prevProps.data.opid) === JSON.stringify(nextProps.data.opid)
  );
});

export default CustomNode;
