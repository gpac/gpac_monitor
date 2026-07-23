/** Extract chunk index from a manifest chunk file path like 'chunks/chunk_0003.jsonl', 'logs/logs_0001.jsonl' or 'checkpoints/cp_0001.json' */
export function chunkIndexFromPath(filePath: string): number {
  const match = filePath.match(/_(\d+)\.jsonl?$/);
  return match ? parseInt(match[1], 10) : -1;
}
