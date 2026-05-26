import { GpacNodeData } from '../domain/gpac';

export interface ProcessingMetricsProps {
  data: GpacNodeData;
  type: 'input' | 'output';
}
