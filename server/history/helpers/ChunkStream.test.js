import { describe, it, expect } from 'vitest';
import { ChunkStream } from './ChunkStream.js';

describe('ChunkStream open chunk visibility', () => {
  it('does not list the currently open chunk while recording', () => {
    const stream = new ChunkStream('logs', 'logs', 1000000);
    stream.write('{"a":1}', 1000);
    stream.write('{"a":2}', 2000);

    expect(stream.getAllChunks()).toEqual([]);
  });

  it('lists a chunk once it rotates', () => {
    const stream = new ChunkStream('logs', 'logs', 1000);
    stream.write('{"a":1}', 0);
    stream.write('{"a":2}', 1000);

    const chunks = stream.getAllChunks();
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({ file: 'logs/logs_0000.jsonl', fromUs: 0, toUs: 1000, count: 2 });
  });

  it('finalizes the open chunk on close with its exact count', () => {
    const stream = new ChunkStream('logs', 'logs', 1000000);
    stream.write('{"a":1}', 1000);
    stream.write('{"a":2}', 2000);
    stream.write('{"a":3}', 3000);

    stream.close();

    const chunks = stream.getAllChunks();
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({ file: 'logs/logs_0000.jsonl', fromUs: 1000, toUs: 3000, count: 3 });
  });

  it('does not add an entry on close when nothing was ever written to the open chunk', () => {
    const stream = new ChunkStream('logs', 'logs', 1000);
    stream.write('{"a":1}', 0);
    stream.write('{"a":2}', 1000);
    stream.close();

    expect(stream.getAllChunks()).toHaveLength(1);
  });
});
