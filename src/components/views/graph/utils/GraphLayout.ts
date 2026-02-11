import { Node } from '@xyflow/react';

export enum LayoutType {
  DAGRE = 'dagre',
}

export interface LayoutOptions {
  type?: LayoutType;
  direction?: 'LR' | 'RL' | 'TB' | 'BT';
  nodeSeparation?: number;
  rankSeparation?: number;
  nodeFilter?: (node: Node) => boolean;
  paddingX?: number;
  paddingY?: number;
  respectExistingPositions?: boolean;
}
