import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { FilterStatsResponse } from '@/types/domain/gpac/filter-stats';
import { useInputsTabData } from '../useInputsTabData';
import { useOutputsTabData } from '../useOutputsTabData';

const nullFilterData = null as unknown as FilterStatsResponse;

describe('PID tabs hooks with absent filterData', () => {
  it('useInputsTabData returns empty data instead of throwing when filterData is null', () => {
    const { result } = renderHook(() => useInputsTabData(nullFilterData));

    expect(result.current.inputPidsWithIndices).toEqual([]);
    expect(result.current.inputNames).toEqual([]);
  });

  it('useOutputsTabData returns empty data instead of throwing when filterData is null', () => {
    const { result } = renderHook(() => useOutputsTabData(nullFilterData));

    expect(result.current.pidsWithIndices).toEqual([]);
  });
});
