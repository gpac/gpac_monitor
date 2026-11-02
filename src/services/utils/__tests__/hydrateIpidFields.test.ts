import { describe, it, expect } from 'vitest';
import type { PIDproperties } from '@/types/domain/gpac/filter-stats';
import { hydrateIpidFields } from '../hydrateIpidFields';

describe('hydrateIpidFields', () => {
  it('reads the channel count from the NumChannels property', () => {
    const inputPid = {
      channels: null,
      properties: { NumChannels: { type: 'uint', value: 2 } },
    } as unknown as PIDproperties;

    hydrateIpidFields({ audio: inputPid });

    expect(inputPid.channels).toBe(2);
  });
});
