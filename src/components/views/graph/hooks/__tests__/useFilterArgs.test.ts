import { renderHook, act } from '@testing-library/react';
import { useFilterArgs } from '../useFilterArgs';
import { SubscriptionType } from '@/types/communication/subscription';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock du service GPAC
const mockSubscribe = vi.fn();
const mockGetFilterDetails = vi.fn();

vi.mock('@/shared/hooks/useGpacService', () => ({
  useGpacService: () => ({
    subscribe: mockSubscribe,
    getFilterDetails: mockGetFilterDetails,
  }),
}));

describe('useFilterArgs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty filter args', () => {
    const { result } = renderHook(() => useFilterArgs());

    expect(result.current.hasFilterArgs(1)).toBe(false);
    expect(result.current.getFilterArgs(1)).toBeUndefined();
    expect(result.current.filterArgs.size).toBe(0);
  });

  it('should request filter args and handle response', () => {
    let subscriptionCallback: ((result: any) => void) | undefined;
    
    mockSubscribe.mockImplementation((config, callback) => {
      subscriptionCallback = callback;
      return vi.fn(); // unsubscribe function
    });

    const { result } = renderHook(() => useFilterArgs());

    // Déclencher la requête
    act(() => {
      result.current.requestFilterArgs(42);
    });

    // Vérifier que la souscription est correcte
    expect(mockSubscribe).toHaveBeenCalledWith(
      {
        type: SubscriptionType.FILTER_ARGS_DETAILS,
        filterIdx: 42,
      },
      expect.any(Function)
    );

    // Vérifier que getFilterDetails est appelé
    expect(mockGetFilterDetails).toHaveBeenCalledWith(42);

    // Simuler la réception des données
    const mockFilterArgs = [
      { name: 'arg1', type: 'str', value: 'test' },
      { name: 'arg2', type: 'uint', value: 123 },
    ];

    act(() => {
      subscriptionCallback?.({
        data: mockFilterArgs,
        timestamp: Date.now(),
        subscriptionId: 'test-id',
      });
    });

    // Vérifier que les données sont stockées
    expect(result.current.hasFilterArgs(42)).toBe(true);
    expect(result.current.getFilterArgs(42)).toEqual(mockFilterArgs);
    expect(result.current.filterArgs.size).toBe(1);
  });

  it('should handle multiple filter args for different indexes', () => {
    let subscriptionCallbacks: Map<number, (result: any) => void> = new Map();
    
    mockSubscribe.mockImplementation((config, callback) => {
      subscriptionCallbacks.set(config.filterIdx, callback);
      return vi.fn();
    });

    const { result } = renderHook(() => useFilterArgs());

    // Requête pour le filtre 1
    act(() => {
      result.current.requestFilterArgs(1);
    });

    // Requête pour le filtre 2  
    act(() => {
      result.current.requestFilterArgs(2);
    });

    // Simuler réception pour filtre 1
    const args1 = [{ name: 'input', type: 'str', value: 'file1.mp4' }];
    act(() => {
      subscriptionCallbacks.get(1)?.({
        data: args1,
        timestamp: Date.now(),
        subscriptionId: 'test-1',
      });
    });

    // Simuler réception pour filtre 2
    const args2 = [{ name: 'codec', type: 'str', value: 'h264' }];
    act(() => {
      subscriptionCallbacks.get(2)?.({
        data: args2,
        timestamp: Date.now(),
        subscriptionId: 'test-2',
      });
    });

    // Vérifier que les deux sont stockés correctement
    expect(result.current.hasFilterArgs(1)).toBe(true);
    expect(result.current.hasFilterArgs(2)).toBe(true);
    expect(result.current.getFilterArgs(1)).toEqual(args1);
    expect(result.current.getFilterArgs(2)).toEqual(args2);
    expect(result.current.filterArgs.size).toBe(2);
  });
});