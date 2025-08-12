import memoize from 'lodash/memoize';
import randomColor from 'randomcolor';
import { useMedia } from 'react-use';
import { Node } from '@xyflow/react';

type NodeType = 'source' | 'filter' | 'sink';

const getsRGB = (rgb: number[]): number[] => {
  const normalized: number[] = rgb.map((component: number) => component / 255);
  const linearRGB: number[] = normalized.map((component: number) =>
    component <= 0.03928
      ? component / 12.92
      : ((component + 0.055) / 1.055) ** 2.4,
  );
  return linearRGB;
};

const getLuminance = (rgb: number[]): number => {
  const linearRGB: number[] = getsRGB(rgb);
  const [r, g, b]: number[] = linearRGB;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const getContrast = (f: number[], b: number[]): number => {
  const L1: number = getLuminance(f);
  const L2: number = getLuminance(b);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
};

const getTextColor = (bgColor: number[]): string => {
  const whiteContrast: number = getContrast(bgColor, [255, 255, 255]);
  const blackContrast: number = getContrast(bgColor, [0, 0, 0]);
  return whiteContrast > blackContrast ? '#ffffff' : '#000000';
};

const getNodeType = (node: Node): NodeType => {
  const nodeData = node.data;
  if (!nodeData) return 'filter';

  const hasOutputs =
    typeof nodeData.nb_opid === 'number' && nodeData.nb_opid > 0;
  const hasInputs =
    typeof nodeData.nb_ipid === 'number' && nodeData.nb_ipid > 0;

  if (!hasInputs && hasOutputs) return 'source';
  if (hasInputs && !hasOutputs) return 'sink';
  return 'filter';
};

const getColorForNodeType = (
  nodeType: NodeType,
  theme: 'dark' | 'light',
): string => {
  const hueRanges = {
    source: { min: 75, max: 150 },
    filter: { min: 200, max: 280 },
    sink: { min: 340, max: 360 },
  };

  const range = hueRanges[nodeType];
  let hue: number;
  if (range.min <= range.max) {
    hue = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  } else {
    // For ranges that wrap around (e.g., 340-20), pick from 340-360 or 0-20
    const wrap =
      Math.random() < (360 - range.min) / (360 - range.min + range.max);
    hue = wrap
      ? Math.floor(Math.random() * (360 - range.min + 1)) + range.min
      : Math.floor(Math.random() * (range.max + 1));
  }

  return randomColor({
    luminosity: theme,
    format: 'hex',
    hue: hue,
  }) as string;
};

const getGraphNodeColor = memoize(
  (_nodeId: string, nodeType: NodeType, theme: 'dark' | 'light') => {
    const bgColor = getColorForNodeType(nodeType, theme);
    const rgbArray = [
      parseInt(bgColor.slice(1, 3), 16),
      parseInt(bgColor.slice(3, 5), 16),
      parseInt(bgColor.slice(5, 7), 16),
    ];
    const textColor = getTextColor(rgbArray);
    return [textColor, bgColor];
  },
  (nodeId, nodeType, theme) => `${nodeId}-${nodeType}-${theme}`,
);

export const useGraphColors = (node: Node) => {
  const theme = useMedia('(prefers-color-scheme: dark)') ? 'dark' : 'light';
  const nodeType = getNodeType(node);
  return getGraphNodeColor(node.id, nodeType, theme);
};

export const getImmediateGraphColor = (
  node: Node,
  theme?: 'dark' | 'light',
) => {
  const themeToUse =
    theme ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light');
  const nodeType = getNodeType(node);
  return getGraphNodeColor(node.id, nodeType, themeToUse)[1];
};
