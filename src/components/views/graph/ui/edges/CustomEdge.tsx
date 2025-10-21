import { memo } from 'react';
import { BaseEdge, getBezierPath, EdgeProps } from '@xyflow/react';

const CustomEdge = memo(
  ({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
    ...props
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
      <BaseEdge
        path={edgePath}
        style={{
          strokeWidth: 5,
          strokeOpacity: 1,
          ...style,
        }}
        markerEnd={markerEnd}
        {...props}
      />
    );
  },
);

CustomEdge.displayName = 'CustomEdge';

export default CustomEdge;
