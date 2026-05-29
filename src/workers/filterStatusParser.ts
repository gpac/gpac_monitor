export type StatusBool = { type: 'bool'; key: string };
export type StatusNum = {
  type: 'num';
  key: string;
  value: number;
  fraction?: { num: number; den: number };
  unit?: string;
};
export type StatusStr = {
  type: 'str';
  key: string;
  value: string;
  quoted: boolean;
};
export type StatusArray = { type: 'array'; items: StatusArrayItem[] };

export type StatusScalar = StatusBool | StatusNum | StatusStr;
export type StatusEntry = StatusScalar | StatusArray;

export interface StatusArrayItem {
  name: string;
  entries: StatusScalar[];
}

export interface ParsedFilterStatus {
  raw: string;
  entries: StatusEntry[];
}

function parseScalarToken(token: string): StatusScalar | null {
  const separatorIdx = token.indexOf('=');

  if (separatorIdx === -1) {
    return /^\w+$/.test(token) ? { type: 'bool', key: token } : null;
  }

  const key = token.slice(0, separatorIdx);
  const rawValue = token.slice(separatorIdx + 1);
  if (!key) return null;

  if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
    return { type: 'str', key, value: rawValue.slice(1, -1), quoted: true };
  }

  const fractionMatch = rawValue.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = Number(fractionMatch[1]);
    const denominator = Number(fractionMatch[2]);
    const value = denominator !== 0 ? numerator / denominator : 0;
    return {
      type: 'num',
      key,
      value,
      fraction: { num: numerator, den: denominator },
    };
  }

  const numericValue = Number(rawValue);
  if (!isNaN(numericValue) && rawValue !== '') {
    return { type: 'num', key, value: numericValue };
  }

  return { type: 'str', key, value: rawValue, quoted: false };
}

// space-split, quoted values kept as single token
function splitStatusTokens(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuote = false;

  for (const char of input) {
    if (char === '"') {
      inQuote = !inQuote;
      current += char;
    } else if (char === ' ' && !inQuote) {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}

function parseArrayItem(itemStr: string): StatusArrayItem | null {
  const parts = itemStr.trim().split(/\s+/);
  if (!parts[0]) return null;

  const entries: StatusScalar[] = [];
  for (let i = 1; i < parts.length; i++) {
    const scalar = parseScalarToken(parts[i]);
    if (scalar) entries.push(scalar);
  }

  return { name: parts[0], entries };
}

export function parseFilterStatus(raw: string): ParsedFilterStatus {
  if (!raw?.trim()) return { raw: raw ?? '', entries: [] };

  const entries: StatusEntry[] = [];
  let scalarPart = raw;
  let arrayEntry: StatusArray | null = null;

  const arrayStart = raw.indexOf('[');
  const arrayEnd = raw.lastIndexOf(']');

  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    const arrayContent = raw.slice(arrayStart + 1, arrayEnd);
    scalarPart = (raw.slice(0, arrayStart) + raw.slice(arrayEnd + 1)).trim();

    const items = arrayContent
      .split(',')
      .map(parseArrayItem)
      .filter((item): item is StatusArrayItem => item !== null);

    if (items.length > 0) arrayEntry = { type: 'array', items };
  }

  for (const token of splitStatusTokens(scalarPart)) {
    const scalar = parseScalarToken(token);
    if (!scalar) continue;

    if (scalar.type === 'bool') {
      const lastEntry = entries[entries.length - 1];
      if (lastEntry?.type === 'num') {
        lastEntry.unit = scalar.key;
        continue;
      }
    }

    entries.push(scalar);
  }

  if (arrayEntry) entries.push(arrayEntry);

  return { raw, entries };
}
