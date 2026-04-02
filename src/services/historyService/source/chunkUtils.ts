/** Extract chunk index from a manifest chunk file path like 'chunks/chunk_0003.jsonl' */
export function chunkIndexFromPath(filePath: string): number {
  const match = filePath.match(/chunk_(\d+)\.jsonl$/);
  return match ? parseInt(match[1], 10) : -1;
}
