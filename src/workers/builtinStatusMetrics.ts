import type { MetricDefinitionMap } from './metricDefinitionParser';

export const BUILTIN_STATUS_METRICS: MetricDefinitionMap = {
  prog: { type: 'num', label: 'Progress', freg: '*' },
  done: { type: 'bool', label: 'Done', freg: '*' },
  pc: { type: 'num', label: 'Percent', freg: '*', unit: 'pc' },
  info: { type: 'str', label: 'Info', freg: '*' },
  type: {
    type: 'str',
    label: 'Stream type',
    freg: '*',
    values: [
      { code: 'V', desc: 'Video' },
      { code: 'A', desc: 'Audio' },
      { code: 'T', desc: 'Text' },
      { code: 'M', desc: 'Metadata' },
    ],
  },
  time: { type: 'str', label: 'Time', freg: '*', unit: 's' },
  r_rate: { type: 'num', label: 'Reception rate', freg: '*', unit: 'kbps' },
  r_bytes: { type: 'num', label: 'Bytes received', freg: '*' },
  r_pck: { type: 'num', label: 'Packets received', freg: '*' },
  s_rate: { type: 'num', label: 'Send rate', freg: '*', unit: 'kbps' },
  s_bytes: { type: 'num', label: 'Bytes sent', freg: '*' },
  s_pck: { type: 'num', label: 'Packets sent', freg: '*' },
  ohead: {
    type: 'num',
    label: 'Mux overhead',
    freg: '*',
    unit: 'pc',
    info: 'overhead of mux / packetization / etc',
  },
  ohead_pc: {
    type: 'num',
    label: 'Per-packet overhead',
    freg: '*',
    info: 'per-packet overhead of mux / packetization / etc in bytes per packet',
  },
  twnd: { type: 'num', label: 'Stats time window', freg: '*', unit: 'ms' },
  wait: {
    type: 'bool',
    label: 'Waiting',
    freg: '*',
    info: 'the filter is in a waiting state',
  },
  buffer: { type: 'frac', label: 'Buffer occupancy', freg: '*', unit: 'ms' },
  fps: { type: 'num', label: 'Frames per second', freg: '*', unit: 'fps' },
};
