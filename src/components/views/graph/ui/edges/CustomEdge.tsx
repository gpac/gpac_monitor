import { memo } from 'react';
import { getBezierPath, EdgeProps } from '@xyflow/react';

const CustomEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
  }: EdgeProps) => {
    const [edgePath] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    return (
      <g>
        <path
          id={id}
          className="react-flow__edge-path"
          d={edgePath}
          strokeWidth={5}
          markerEnd={markerEnd}
          style={{
            strokeOpacity: 1,
            cursor: 'pointer',
            ...style,
          }}
        >
          <title>Click to see IPID Properties</title>
        </path>
      </g>
    );
  },
);

CustomEdge.displayName = 'CustomEdge';

export default CustomEdge;
