import { describe, expect, it } from 'vitest';
import { connectionMethods } from '../service.connection';

describe('connectionMethods.ready', () => {
  it('loads again after a failed attempt', async () => {
    const state = { readyPromise: null };
    let loadCount = 0;
    const load = async () => {
      loadCount += 1;
      if (loadCount === 1) throw new Error('refused');
      return true;
    };

    await expect(
      connectionMethods.ready(state, 'ws://localhost:6363', load),
    ).rejects.toThrow('refused');
    await expect(
      connectionMethods.ready(state, 'ws://localhost:6363', load),
    ).resolves.toBeUndefined();
    expect(loadCount).toBe(2);
  });
});
