import { describe, it, expect } from 'vitest';
import { createEdgesFromFilters, createNodesFromFilters } from '../GraphOperations';
import { GraphFilterData } from '@/types/domain/gpac';

function makeFilter(
  idx: number,
  name: string,
  ipid: GraphFilterData['ipid'],
  opid: GraphFilterData['opid'],
): GraphFilterData {
  return {
    idx,
    name,
    type: 'filter',
    status: '',
    itag: null,
    ID: null,
    nb_ipid: ipid.length,
    nb_opid: opid.length,
    ipid,
    opid,
  };
}

describe('createEdgesFromFilters', () => {
  it('creates one edge for a single-source connection', () => {
    const src = makeFilter(0, 'mp4dmx', [], [
      { pid_index: 0, name: 'video', stream_type: 'Visual' },
    ]);
    const reframer = makeFilter(1, 'reframer', [
      { pid_index: 0, name: 'video', source_idx: 0, stream_type: 'Visual' },
    ], []);

    const edges = createEdgesFromFilters([src, reframer], []);
    expect(edges).toHaveLength(1);
    expect(edges[0].id).toBe('edge:0->1:ipid:0');
    expect(edges[0].source).toBe('0');
    expect(edges[0].target).toBe('1');
    expect(edges[0].targetHandle).toBe('ipid-0');
    expect(edges[0].sourceHandle).toBe('opid-0');
  });

  it('creates two edges when two sources have input PIDs with the same name (regression: gpac -i video.mp4 -i video.mp4 reframer)', () => {
    const src1 = makeFilter(0, 'mp4dmx#1', [], [
      { pid_index: 0, name: 'video', stream_type: 'Visual' },
    ]);
    const src2 = makeFilter(1, 'mp4dmx#2', [], [
      { pid_index: 0, name: 'video', stream_type: 'Visual' },
    ]);
    const reframer = makeFilter(2, 'reframer', [
      { pid_index: 0, name: 'video', source_idx: 0, stream_type: 'Visual' },
      { pid_index: 1, name: 'video', source_idx: 1, stream_type: 'Visual' },
    ], []);

    const edges = createEdgesFromFilters([src1, src2, reframer], []);

    expect(edges).toHaveLength(2);

    const edge1 = edges.find((e) => e.id === 'edge:0->2:ipid:0');
    const edge2 = edges.find((e) => e.id === 'edge:1->2:ipid:1');

    expect(edge1).toBeDefined();
    expect(edge1?.source).toBe('0');
    expect(edge1?.target).toBe('2');
    expect(edge1?.targetHandle).toBe('ipid-0');

    expect(edge2).toBeDefined();
    expect(edge2?.source).toBe('1');
    expect(edge2?.target).toBe('2');
    expect(edge2?.targetHandle).toBe('ipid-1');
  });

  it('creates no edges for source filters with no input PIDs', () => {
    const src = makeFilter(0, 'mp4dmx', [], [
      { pid_index: 0, name: 'video', stream_type: 'Visual' },
    ]);
    const edges = createEdgesFromFilters([src], []);
    expect(edges).toHaveLength(0);
  });

  it('uses stable edge IDs regardless of PID display name', () => {
    const src = makeFilter(3, 'src', [], [
      { pid_index: 0, name: 'audio_track_1', stream_type: 'Audio' },
      { pid_index: 1, name: 'audio_track_1', stream_type: 'Audio' },
    ]);
    const sink = makeFilter(5, 'sink', [
      { pid_index: 0, name: 'audio_track_1', source_idx: 3, stream_type: 'Audio' },
      { pid_index: 1, name: 'audio_track_1', source_idx: 3, stream_type: 'Audio' },
    ], []);

    const edges = createEdgesFromFilters([src, sink], []);
    expect(edges).toHaveLength(2);
    expect(edges[0].id).toBe('edge:3->5:ipid:0');
    expect(edges[1].id).toBe('edge:3->5:ipid:1');
  });
});

describe('createNodesFromFilters', () => {
  it('creates one node per filter', () => {
    const filters: GraphFilterData[] = [
      makeFilter(0, 'mp4dmx', [], [{ pid_index: 0, name: 'video', stream_type: 'Visual' }]),
      makeFilter(1, 'reframer', [{ pid_index: 0, name: 'video', source_idx: 0, stream_type: 'Visual' }], []),
    ];
    const nodes = createNodesFromFilters(filters);
    expect(nodes).toHaveLength(2);
    expect(nodes.map((n) => n.id)).toEqual(['0', '1']);
  });
});
