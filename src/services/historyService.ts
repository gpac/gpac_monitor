import type { AlignedData } from 'uplot';
import type { Database } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

let db: Database | null = null;

const SCHEMA = `
  CREATE TABLE stats (
    t INTEGER PRIMARY KEY,
    idx INTEGER,
    status TEXT,
    bytes_done INTEGER,
    bytes_sent INTEGER,
    pck_done INTEGER,
    pck_sent INTEGER,
    time INTEGER,
    nb_ipid INTEGER,
    nb_opid INTEGER,
    errors INTEGER,
    current_errors INTEGER
  );
  CREATE INDEX idx_filter ON stats(idx);
`;

const INSERT_SQL = `
  INSERT INTO stats (t, idx, status, bytes_done, bytes_sent,
    pck_done, pck_sent, time, nb_ipid, nb_opid, errors, current_errors)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
`;

async function initDB(): Promise<Database> {
  const initSqlJs = (await import('sql.js')).default;
  const SQL = await initSqlJs({
    locateFile: () => sqlWasmUrl,
  });
  return new SQL.Database();
}

function insertStats(
  database: Database,
  stats: Record<string, unknown>[],
  rowIndex: number,
): number {
  for (const s of stats) {
    database.run(INSERT_SQL, [
      rowIndex++,
      Number(s.idx ?? -1),
      String(s.status ?? ''),
      Number(s.bytes_done ?? 0),
      Number(s.bytes_sent ?? 0),
      Number(s.pck_done ?? 0),
      Number(s.pck_sent ?? 0),
      Number(s.time ?? 0),
      Number(s.nb_ipid ?? 0),
      Number(s.nb_opid ?? 0),
      Number(s.errors ?? 0),
      Number(s.current_errors ?? 0),
    ]);
  }
  return rowIndex;
}

export async function loadFile(file: File): Promise<void> {
  console.log('[historyService] loadFile called, file:', file.name, file.size, 'bytes');
  if (db) db.close();
  db = await initDB();
  console.log('[historyService] sql.js DB initialized');
  db.run(SCHEMA);

  const stream = file.stream();
  const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  let rowIndex = 0;
  let linesRead = 0;
  let statsMessages = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      linesRead++;
      const msg = JSON.parse(line);
      if (msg.message === 'session_stats' && Array.isArray(msg.stats)) {
        statsMessages++;
        rowIndex = insertStats(db, msg.stats, rowIndex);
      }
    }
  }
  // Process remaining buffer
  if (buffer.trim()) {
    linesRead++;
    const msg = JSON.parse(buffer);
    if (msg.message === 'session_stats' && Array.isArray(msg.stats)) {
      statsMessages++;
      insertStats(db, msg.stats, rowIndex);
    }
  }
  console.log(`[historyService] Done: ${linesRead} lines, ${statsMessages} stats messages, ${rowIndex} rows inserted`);
}

export function getFilterIds(): number[] {
  if (!db) { console.log('[historyService] getFilterIds: no DB'); return []; }
  const result = db.exec('SELECT DISTINCT idx FROM stats ORDER BY idx');
  if (!result.length) { console.log('[historyService] getFilterIds: no results'); return []; }
  const ids = result[0].values.map((row) => row[0] as number);
  console.log('[historyService] getFilterIds:', ids);
  return ids;
}

export function getFilterStats(idx: number): AlignedData {
  if (!db) { console.log('[historyService] getFilterStats: no DB'); return [[], [], []]; }
  const result = db.exec(
    'SELECT time, bytes_done, pck_sent FROM stats WHERE idx = ? ORDER BY t',
    [idx],
  );
  if (!result.length) { console.log('[historyService] getFilterStats: no results for idx', idx); return [[], [], []]; }
  console.log('[historyService] getFilterStats idx', idx, ':', result[0].values.length, 'rows');

  const rows = result[0].values;
  const time = new Float64Array(rows.length);
  const bytesDone = new Float64Array(rows.length);
  const pckSent = new Float64Array(rows.length);

  for (let i = 0; i < rows.length; i++) {
    time[i] = rows[i][0] as number;
    bytesDone[i] = rows[i][1] as number;
    pckSent[i] = rows[i][2] as number;
  }

  return [time, bytesDone, pckSent] as unknown as AlignedData;
}

export function isLoaded(): boolean {
  return db !== null;
}

export function close(): void {
  if (db) {
    db.close();
    db = null;
  }
}
