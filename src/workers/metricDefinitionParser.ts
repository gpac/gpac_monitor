export type MetricType = 'num' | 'str' | 'frac';

export type EnumValue = { code: string; desc: string };

export type MetricDef = {
  type: MetricType;
  label: string;
  freg: string;
  unit?: string;
  info?: string;
  min?: number;
  max?: number;
  values?: EnumValue[];
};

export type MetricDefinitionMap = Record<string, MetricDef>;

function parseType(raw: string): MetricType {
  if (raw === 'str') return 'str';
  if (raw === 'frac') return 'frac';
  return 'num';
}

function parseLine(line: string): [string, MetricDef] | null {
  const parts = line.split(';');
  if (parts.length < 2) return null;

  const fregPart = parts[0];
  if (!fregPart.startsWith('freg=')) return null;
  const freg = fregPart.slice(5);

  const keyLabelPart = parts[1];
  const eqIdx = keyLabelPart.indexOf('=');
  if (eqIdx === -1) return null;
  const key = keyLabelPart.slice(0, eqIdx);
  const label = keyLabelPart.slice(eqIdx + 1);
  if (!key) return null;

  const def: MetricDef = { type: 'num', label, freg };

  for (let i = 2; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith('t=')) def.type = parseType(part.slice(2));
    else if (part.startsWith('u=')) def.unit = part.slice(2);
    else if (part.startsWith('i=')) def.info = part.slice(2);
    else if (part.startsWith('m=')) {
      const n = Number(part.slice(2));
      if (!isNaN(n)) def.min = n;
    } else if (part.startsWith('M=')) {
      const n = Number(part.slice(2));
      if (!isNaN(n)) def.max = n;
    } else if (part.startsWith('v=[') && part.endsWith(']')) {
      const inner = part.slice(3, -1);
      def.values = inner
        .split(',')
        .map((item) => {
          const colonIdx = item.indexOf(':');
          if (colonIdx === -1) return { code: item.trim(), desc: '' };
          return {
            code: item.slice(0, colonIdx).trim(),
            desc: item.slice(colonIdx + 1).trim(),
          };
        })
        .filter((item) => item.code !== '');
    }
  }

  return [key, def];
}

export function parseMetricDefinitions(raw: string): MetricDefinitionMap {
  const map: MetricDefinitionMap = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const result = parseLine(trimmed);
    if (result) map[result[0]] = result[1];
  }
  return map;
}
