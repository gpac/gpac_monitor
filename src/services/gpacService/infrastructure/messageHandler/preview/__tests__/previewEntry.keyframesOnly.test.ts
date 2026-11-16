import { afterEach, describe, it, expect, vi } from 'vitest';
import { PreviewEntry } from '../previewEntry';
import type { MessageHandlerDependencies } from '../../types';

vi.mock('../previewWorker', () => ({
  PreviewWorker: { open: vi.fn() },
}));

const dependencies: MessageHandlerDependencies = {
  isConnected: vi.fn(() => true),
  send: vi.fn().mockResolvedValue(undefined),
  stopReconnection: vi.fn(),
  markEndOfSession: vi.fn(),
};

function makeEntry(): PreviewEntry {
  return new PreviewEntry(
    1,
    { filterIdx: 0, pidIdx: 0, direction: 'input' },
    { codec: 'avc', decoderConfig: null },
    dependencies,
  );
}

function makePvwcFrame(flags: number): DataView {
  const view = new DataView(new ArrayBuffer(28));
  view.setUint32(4, 1, true);
  view.setUint32(12, flags, true);
  return view;
}

describe('PreviewEntry keyframesOnly', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    { flags: 0, keyframesOnly: false },
    { flags: 1, keyframesOnly: false },
    { flags: 2, keyframesOnly: true },
    { flags: 3, keyframesOnly: true },
  ])(
    'reads keyframesOnly=$keyframesOnly from flags $flags',
    ({ flags, keyframesOnly }) => {
      const entry = makeEntry();
      entry.decodePacket(makePvwcFrame(flags));
      expect(entry.getSnapshot().keyframesOnly).toBe(keyframesOnly);
    },
  );

  it('notifies subscribers only when the mode changes', () => {
    vi.useFakeTimers();
    const entry = makeEntry();
    const notifiedModes: boolean[] = [];
    const unsubscribe = entry.subscribe(
      (snapshot) => notifiedModes.push(snapshot.keyframesOnly),
      { immediate: false, debounce: 0 },
    );

    try {
      for (const flags of [3, 3, 2, 3, 1, 0, 1]) {
        entry.decodePacket(makePvwcFrame(flags));
        vi.runOnlyPendingTimers();
      }

      expect(notifiedModes).toEqual([true, false]);
    } finally {
      unsubscribe();
    }
  });
});
