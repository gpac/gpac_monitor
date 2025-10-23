import React, { useMemo, memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GraphFilterData } from '@/types/domain/gpac';
import { determineFilterSessionType } from '../../utils/filterType';
import { useGraphColors } from '../../hooks/layout/useGraphColors';

interface CustomNodeProps extends NodeProps {
  data: GraphFilterData & {
    label: string;
    filterType: string;
  } & Record<string, unknown>;
}

const CustomNodeBase: React.FC<CustomNodeProps> = ({
  data,
  selected,
  ...nodeProps
}) => {
  const { label, ipid, opid, nb_ipid, nb_opid } = data;
  const sessionType = useMemo(() => determineFilterSessionType(data), [data]);
  const node = useMemo(
    () => ({
      data,
      position: { x: 0, y: 0 },
      ...nodeProps,
    }),
    [data, nodeProps],
  );

  const [textColor, backgroundColor] = useGraphColors(node);

  // Sync with Redux when selected
  // TEMPORARILY DISABLED: Properties panel will be accessed via settings icon
  // useEffect(() => {
  //   if (!selected) {
  //     requestedRef.current = false;
  //     return;
  //   }
  //
  //   if (!hasFilterArgs(idx) && !requestedRef.current) {
  //     requestedRef.current = true;
  //     requestFilterArgs(idx);
  //   }
  //
  //   const interval = setInterval(() => {
  //     const args = getFilterArgs(idx);
  //     if (args && args.length > 0) {
  //       dispatch(setSelectedNode({ idx, name, gpac_args: args }));
  //       clearInterval(interval);
  //     }
  //   }, 100);
  //
  //   return () => clearInterval(interval);
  // }, [
  //   selected,
  //   idx,
  //   name,
  //   hasFilterArgs,
  //   requestFilterArgs,
  //   getFilterArgs,
  //   dispatch,
  // ]);
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
    <div
      className={`
        gpacer-node border-2 rounded-xl p-4 min-w-[200px] shadow-sm
        ${selected ? 'ring-3 ring-emerald-500 shadow-lg' : ''}
        transition-all duration-200
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
          <h3 className="font-bold text-sm drop-shadow-sm" style={textStyle}>
            {label}
          </h3>
          <div
            className="text-xs font-medium px-2 py-1 bg-white/20 rounded-full"
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
          </div>
        </div>
      </div>

      {/* Node content */}
      <div className="node-drag-handle cursor-move">
        <div className="flex justify-between items-start mb-2">
          {/* INPUTS on the left */}
          <div className="flex-1 text-xs text-gray-600 pr-2">
            {nb_ipid > 0 && (
              <>
                <span className="font-medium text-gray-300 block text-left">
                  INPUTS
                </span>
                <div className="mt-1">
                  {Object.keys(ipid).map((pidId) => (
                    <div key={pidId} className="text-xs text-gray-200 truncate">
                      {pidId}
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
                <span className="font-medium text-gray-300 block text-right">
                  OUTPUTS
                </span>
                <div className="mt-1">
                  {Object.keys(opid).map((pidId) => (
                    <div
                      key={pidId}
                      className="text-xs text-gray-200 text-right truncate"
                    >
                      {pidId}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="text-xs text-gray-200 pt-2 border-t border-gray-200 text-center">
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
  );
};
const CustomNode = memo(CustomNodeBase, (prevProps, nextProps) => {
  // Only re-render if essential props changed
  return (
    prevProps.data.idx === nextProps.data.idx &&
    prevProps.data.name === nextProps.data.name &&
    prevProps.data.nb_ipid === nextProps.data.nb_ipid &&
    prevProps.data.nb_opid === nextProps.data.nb_opid &&
    prevProps.selected === nextProps.selected &&
    JSON.stringify(prevProps.data.ipid) ===
      JSON.stringify(nextProps.data.ipid) &&
    JSON.stringify(prevProps.data.opid) === JSON.stringify(nextProps.data.opid)
  );
});

export default CustomNode;
