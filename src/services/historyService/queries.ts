import type { AlignedData } from 'uplot';
import { getDb, setDb } from './db';

export function getFilterTypes(): Map<number, string> {
  const db = getDb();
  if (!db) return new Map();
  const result = db.exec('SELECT filters_json FROM graphs ORDER BY graph_v ASC');
  if (!result.length) return new Map();
  const map = new Map<number, string>();
  for (const row of result[0].values) {
    const filters = JSON.parse(row[0] as string) as Array<{
      idx: number;
      type: string;
    }>;
    for (const f of filters) map.set(f.idx, f.type);
  }
  return map;
}

export function getFilterIds(): number[] {
  const db = getDb();
  if (!db) return [];
  const result = db.exec('SELECT DISTINCT idx FROM metrics ORDER BY idx');
  if (!result.length) return [];
  return result[0].values.map((row: unknown[]) => row[0] as number);
}

export function getFilterStats(idx: number): AlignedData {
  const db = getDb();
  if (!db) return [[], [], [], [], [], [], []];
  const result = db.exec(
    'SELECT ts_us, graph_v, bytes_done, bytes_sent, pck_done, pck_sent, errors FROM metrics WHERE idx = ? ORDER BY ts_us',
    [idx],
  );
  if (!result.length) return [[], [], [], [], [], [], []];

  const rows = result[0].values;
  const baseUs = rows[0][0] as number;
  const time = new Float64Array(rows.length);
  const graphV = new Float64Array(rows.length);
  const bytesDone = new Float64Array(rows.length);
  const bytesSent = new Float64Array(rows.length);
  const pckDone = new Float64Array(rows.length);
  const pckSent = new Float64Array(rows.length);
  const errors = new Float64Array(rows.length);

  for (let i = 0; i < rows.length; i++) {
    time[i] = ((rows[i][0] as number) - baseUs) / 1_000_000;
    graphV[i] = rows[i][1] as number;
    bytesDone[i] = rows[i][2] as number;
    bytesSent[i] = rows[i][3] as number;
    pckDone[i] = rows[i][4] as number;
    pckSent[i] = rows[i][5] as number;
    errors[i] = rows[i][6] as number;
  }

  return [time, graphV, bytesDone, bytesSent, pckDone, pckSent, errors] as unknown as AlignedData;
}

export function isLoaded(): boolean {
  return getDb() !== null;
}

export function close(): void {
  const db = getDb();
  if (db) {
    db.close();
    setDb(null);
  }
}
