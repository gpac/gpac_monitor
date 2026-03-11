import type { Database } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

const state: { db: Database | null } = { db: null };

export function getDb(): Database | null {
  return state.db;
}

export function setDb(newDb: Database | null): void {
  state.db = newDb;
}

export const SCHEMA = `
  CREATE TABLE graphs (graph_v INTEGER, ts_us REAL, filters_json TEXT);
  CREATE TABLE metrics (
    ts_us REAL, graph_v INTEGER, idx INTEGER,
    bytes_done INTEGER, bytes_sent INTEGER,
    pck_done INTEGER, pck_sent INTEGER,
    time INTEGER, nb_ipid INTEGER, nb_opid INTEGER, errors INTEGER
  );
  CREATE INDEX idx_metrics_filter ON metrics(idx);
`;

export const INSERT_GRAPH = `
  INSERT INTO graphs (graph_v, ts_us, filters_json) VALUES (?,?,?)
`;

export const INSERT_METRIC = `
  INSERT INTO metrics (ts_us, graph_v, idx, bytes_done, bytes_sent,
    pck_done, pck_sent, time, nb_ipid, nb_opid, errors)
  VALUES (?,?,?,?,?,?,?,?,?,?,?)
`;

export async function initDB(): Promise<Database> {
  const initSqlJs = (await import('sql.js')).default;
  const SQL = await initSqlJs({ locateFile: () => sqlWasmUrl });
  return new SQL.Database();
}
