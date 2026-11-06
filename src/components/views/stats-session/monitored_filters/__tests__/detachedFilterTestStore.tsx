import { configureStore, type UnknownAction } from '@reduxjs/toolkit';
import { Profiler, type ProfilerOnRenderCallback } from 'react';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react';
import widgetsReducer from '@/shared/store/widgets/widgetsSlice';
import type { WidgetsState } from '@/shared/store/widgets/types';
import sessionStatsReducer from '@/shared/store/slices/sessionStatsSlice';
import monitoredFilterReducer from '@/shared/store/slices/monitoredFilterSlice';
import { filtersUpdated } from '@/shared/store/actions/globalActions';
import { useAppSelector } from '@/shared/hooks/redux';
import { WidgetType } from '@/types/ui/widget';
import type { GraphFilterData } from '@/types/domain/gpac/model';
import { DetachedFilterSelector } from '../DetachedFilterSelector';

export const sessionFilters: GraphFilterData[] = [
  { idx: 3, name: 'mp4dmx' },
  { idx: 7, name: 'vdec' },
  { idx: 0, name: 'vout' },
].map((filter) => ({
  ...filter,
  type: 'test',
  status: '',
  itag: null,
  ID: null,
  nb_ipid: 0,
  nb_opid: 0,
  ipid: [],
  opid: [],
}));

function SelectedPanel() {
  const widget = useAppSelector((state) =>
    state.widgets.activeWidgets.find((candidate) => candidate.id === 'panel'),
  );
  return widget?.detachedFilterIdx !== undefined ? (
    <DetachedFilterSelector
      widgetId={widget.id}
      filterIdx={widget.detachedFilterIdx}
    />
  ) : null;
}

export function openSelector() {
  fireEvent.keyDown(
    screen.getByRole('button', { name: 'Change detached filter' }),
    { key: 'ArrowDown' },
  );
}

export function renderSelector(
  options: { open?: boolean; onRender?: ProfilerOnRenderCallback } = {},
) {
  const store = configureStore({
    reducer: {
      widgets: widgetsReducer,
      graph: (state = { filters: sessionFilters }, action: UnknownAction) =>
        filtersUpdated.match(action) ? { filters: action.payload } : state,
      sessionStats: sessionStatsReducer,
      monitoredFilter: monitoredFilterReducer,
    },
    preloadedState: {
      widgets: {
        activeWidgets: [
          {
            id: 'panel',
            type: WidgetType.FILTERSESSION,
            isDetached: true,
            detachedFilterIdx: 3,
            title: 'mp4dmx',
            x: 0,
            y: 0,
            w: 8,
            h: 6,
          },
          {
            id: 'other',
            type: WidgetType.FILTERSESSION,
            isDetached: true,
            detachedFilterIdx: 7,
            title: 'vdec',
            x: 8,
            y: 0,
            w: 8,
            h: 6,
          },
        ],
        configs: {
          panel: { isMaximized: false, isMinimized: false, settings: {} },
          other: { isMaximized: false, isMinimized: false, settings: {} },
        },
        savedLayouts: {},
        viewByFilter: {
          3: { mode: 'detached', widgetId: 'panel' },
          7: { mode: 'detached', widgetId: 'other' },
        },
      } satisfies WidgetsState,
    },
  });
  render(
    <Provider store={store}>
      <Profiler
        id="detached-filter-selector"
        onRender={options.onRender ?? (() => {})}
      >
        <SelectedPanel />
      </Profiler>
    </Provider>,
  );
  if (options.open !== false) openSelector();
  return store;
}
