import { getDb, setDb, initDB, SCHEMA, INSERT_GRAPH, INSERT_METRIC } from './db';

export async function loadFile(file: File): Promise<void> {
  const t0 = performance.now();
  const existing = getDb();
  if (existing) existing.close();

  const db = await initDB();
  setDb(db);
  db.run(SCHEMA);

  const reader = file.stream().pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  let linesRead = 0;
  let rowsInserted = 0;

  const processLine = (line: string) => {
    if (!line.trim()) return;
    linesRead++;
    const msg = JSON.parse(line) as Record<string, unknown>;

    if (msg.type === 'graph') {
      db.run(INSERT_GRAPH, [
        Number(msg.graph_v ?? 0),
        Number(msg.ts_us ?? 0),
        String(msg.filters_json ?? '[]'),
      ]);
      rowsInserted++;
    } else if (msg.type === 'metric') {
      db.run(INSERT_METRIC, [
        Number(msg.ts_us ?? 0),
        Number(msg.graph_v ?? 0),
        Number(msg.idx ?? -1),
        Number(msg.bytes_done ?? 0),
        Number(msg.bytes_sent ?? 0),
        Number(msg.pck_done ?? 0),
        Number(msg.pck_sent ?? 0),
        Number(msg.time ?? 0),
        Number(msg.nb_ipid ?? 0),
        Number(msg.nb_opid ?? 0),
        Number(msg.errors ?? 0),
      ]);
      rowsInserted++;
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) processLine(line);
  }
  if (buffer.trim()) processLine(buffer);

  const elapsed = (performance.now() - t0).toFixed(1);
  const sizeKb = (file.size / 1024).toFixed(1);
  console.log(
    `[historyService] Loaded ${sizeKb} KB, ${linesRead} lines, ${rowsInserted} rows in ${elapsed}ms`,
  );
}
