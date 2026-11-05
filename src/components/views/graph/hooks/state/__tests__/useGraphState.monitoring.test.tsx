import { PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react';
import type { Edge, Node } from '@xyflow/react';
import { describe, expect, it } from 'vitest';
import { useGraphState } from '../useGraphState';
import graphReducer, {
  setSelectedNode,
} from '@/shared/store/slices/graphSlice';
import widgetsReducer, {
  openFilterInline,
  closeFilter,
} from '@/shared/store/widgets/widgetsSlice';

const graphEdges: Edge[] = [
  { id: 'edge-1-2', source: '1', target: '2' },
  { id: 'edge-2-3', source: '2', target: '3' },
];

const createStore = () => {
  const initialGraphState = graphReducer(undefined, { type: 'test/init' });
  return configureStore({
    reducer: { graph: graphReducer, widgets: widgetsReducer },
    preloadedState: {
      graph: { ...initialGraphState, edges: graphEdges },
    },
  });
};

const animatedFlags = (edges: Edge[]) => edges.map((edge) => edge.animated);

describe('useGraphState edge animation while filters are monitored', () => {
  it('follows monitoring transitions without topology or selection change', () => {
    const store = createStore();
    store.dispatch(setSelectedNode('2'));
    const wrapper = ({ children }: PropsWithChildren) => (
      <Provider store={store}>{children}</Provider>
    );
    const nodesRef = { current: [] as Node[] };
    const edgesRef = { current: [] as Edge[] };
    const { result } = renderHook(() => useGraphState(nodesRef, edgesRef), {
      wrapper,
    });

    expect(animatedFlags(result.current.edges)).toEqual([true, true]);

    act(() => {
      store.dispatch(openFilterInline(1));
    });
    expect(animatedFlags(result.current.edges)).toEqual([false, false]);

    act(() => {
      store.dispatch(openFilterInline(2));
    });
    act(() => {
      store.dispatch(closeFilter(1));
    });
    expect(animatedFlags(result.current.edges)).toEqual([false, false]);

    act(() => {
      store.dispatch(closeFilter(2));
    });
    expect(animatedFlags(result.current.edges)).toEqual([true, true]);
  });
});
