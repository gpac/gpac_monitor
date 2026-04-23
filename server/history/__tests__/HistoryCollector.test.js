import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockWriter, sysMock, logHubMock, pidCollectorMock } = vi.hoisted(() => ({
    mockWriter: {
        writeSnapshot: vi.fn(),
        writeEvent: vi.fn(),
        writeCheckpoint: vi.fn(),
        writeLog: vi.fn(),
        close: vi.fn(),
        getCurrentChunkIndex: vi.fn(),
    },
    sysMock: { clock_us: vi.fn() },
    logHubMock: { add: vi.fn(), remove: vi.fn() },
    pidCollectorMock: { collectInputPids: vi.fn(), collectOutputPids: vi.fn() },
}));

vi.mock('../HistoryWriter.js', () => ({
    HistoryWriter: vi.fn(() => mockWriter),
}));

vi.mock('gpaccore', () => ({ Sys: sysMock }));

vi.mock('../../JSClient/Sys/Utils/LogHub.js', () => ({
    logHub: logHubMock,
}));

vi.mock('../../JSClient/Filters/PID/PidDataCollector.js', () => ({
    PidDataCollector: vi.fn(() => pidCollectorMock),
}));

import { HistoryCollector } from '../HistoryCollector.js';

function makeFilter(idx, extra = {}) {
    return { idx, name: `filter_${idx}`, type: 'mock', ipid: {}, opid: {}, ...extra };
}

function makeFilterInstance(args = []) {
    return { all_args: vi.fn(() => args) };
}

describe('HistoryCollector', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockWriter.writeEvent.mockReturnValue(false);
        mockWriter.getCurrentChunkIndex.mockReturnValue(1);
        sysMock.clock_us.mockReturnValue(1000);
        pidCollectorMock.collectInputPids.mockReturnValue({
            V1: { name: 'V1', properties: { SourcePath: { value: 'media/input.mp4' } } },
        });
        pidCollectorMock.collectOutputPids.mockReturnValue({});
    });

    it('rebuilds pid state on recordGraph', () => {
        const collector = new HistoryCollector('history');
        collector.recordGraph([makeFilter(2)], [makeFilterInstance([{ name: 'speed', value: 1 }])], 1);

        expect(collector._currentPidState).toEqual({
            2: {
                ipids: {
                    V1: { name: 'V1', properties: { SourcePath: { value: 'media/input.mp4' } } },
                },
            },
        });
        expect(collector._chunkNeedsCheckpoint).toBe(true);
    });
    it('recordArgUpdated stores args only for touched filters and keeps others', () => {
    const collector = new HistoryCollector('history');

    collector._currentArgState = {
        1: [{ name: 'speed', value: 1 }],
        2: [{ name: 'fullscreen', value: false }],
    };

    collector.recordArgUpdated([2], {
        2: [{ name: 'fullscreen', value: true }],
    });

    expect(collector._currentArgState).toEqual({
        1: [{ name: 'speed', value: 1 }],
        2: [{ name: 'fullscreen', value: true }],
    });

    expect(collector._chunkNeedsCheckpoint).toBe(true);
});
it('writes checkpoint without arg_state when currentArgState is null', () => {
    const collector = new HistoryCollector('history');

    collector._latestStructural = { version: 1, graph_v: 3, filters: [{ idx: 0 }] };
    collector._currentPidState = { 0: { ipids: { V1: { name: 'V1' } } } };
    collector._currentArgState = null;
    collector._chunkNeedsCheckpoint = true;

    collector._writeCheckpointIfNeeded(2, 12345);

    expect(mockWriter.writeCheckpoint).toHaveBeenCalledWith(
        2,
        expect.not.objectContaining({
            arg_state: expect.anything(),
        }),
    );
});
    it('updates only touched filters on recordPidReconfigured', () => {
        const collector = new HistoryCollector('history');
        collector._currentPidState = {
            1: { ipids: { A: { name: 'A' } } },
            2: { ipids: { B: { name: 'B' } } },
        };

        collector.recordPidReconfigured([2], {
            2: { B: { name: 'B', properties: { SourcePath: { value: 'video.mp4' } } } },
        });

        expect(collector._currentPidState).toEqual({
            1: { ipids: { A: { name: 'A' } } },
            2: { ipids: { B: { name: 'B', properties: { SourcePath: { value: 'video.mp4' } } } } },
        });
        expect(collector._chunkNeedsCheckpoint).toBe(true);
    });

    it('writes checkpoint with pid_state for current chunk', () => {
        const collector = new HistoryCollector('history');
        collector._latestStructural = { version: 1, graph_v: 3, filters: [{ idx: 0 }] };
        collector._currentPidState = { 0: { ipids: { V1: { name: 'V1' } } } };
        collector._chunkNeedsCheckpoint = true;

        collector._writeCheckpointIfNeeded(2, 12345);

        expect(mockWriter.writeCheckpoint).toHaveBeenCalledWith(
            2,
            expect.objectContaining({
                version: 1,
                ts_us: 12345,
                graph_v: 3,
                filters: [{ idx: 0 }],
                pid_state: { 0: { ipids: { V1: { name: 'V1' } } } },
            }),
        );
        expect(collector._chunkNeedsCheckpoint).toBe(false);
    });

    it('never writes checkpoint for chunk 0', () => {
        const collector = new HistoryCollector('history');
        collector._latestStructural = { version: 1, graph_v: 1, filters: [{ idx: 0 }] };
        collector._currentPidState = { 0: { ipids: {} } };
        collector._chunkNeedsCheckpoint = true;

        collector._writeCheckpointIfNeeded(0, 12345);

        expect(mockWriter.writeCheckpoint).not.toHaveBeenCalled();
        expect(collector._chunkNeedsCheckpoint).toBe(false);
    });

    it('_onChunkRotated calls _writeCheckpointIfNeeded with current chunk index', () => {
        const collector = new HistoryCollector('history');
        const spy = vi.spyOn(collector, '_writeCheckpointIfNeeded');
        mockWriter.getCurrentChunkIndex.mockReturnValue(3);

        collector._onChunkRotated(555);

        expect(spy).toHaveBeenCalledWith(3, 555);
    });

    it('flushes pending checkpoint on close', () => {
        const collector = new HistoryCollector('history');
        const spy = vi.spyOn(collector, '_writeCheckpointIfNeeded');
        mockWriter.getCurrentChunkIndex.mockReturnValue(4);
        sysMock.clock_us.mockReturnValue(99999);

        collector.close();

        expect(logHubMock.remove).toHaveBeenCalledWith('_hist_');
        expect(spy).toHaveBeenCalledWith(4, 99999);
        expect(mockWriter.close).toHaveBeenCalled();
    });
});
