import {
  createListenerMiddleware,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';

export interface MonitorIntervals {
  SESSION_STATS: number;
  FILTER_STATS: number;
  CPU_STATS: number;
}

export type PreviewKeyframeRate = 10 | 30;

interface MonitorConfigState {
  intervals: MonitorIntervals;
  serverProtocolVersion: number | undefined;
  previewMaxKeyframesPerSec: PreviewKeyframeRate;
}

const PREVIEW_KEYFRAME_RATE_KEY = 'gpac-preview-max-keyframes-per-sec';

const loadPreviewKeyframeRate = (): PreviewKeyframeRate => {
  try {
    return localStorage.getItem(PREVIEW_KEYFRAME_RATE_KEY) === '30' ? 30 : 10;
  } catch {
    return 10;
  }
};

// Fallback only, used until the server's monitor_config message arrives.
// Source of truth: server/config/live.config.js UPDATE_INTERVALS.
const initialState: MonitorConfigState = {
  intervals: { SESSION_STATS: 1000, FILTER_STATS: 1000, CPU_STATS: 500 },
  serverProtocolVersion: undefined,
  previewMaxKeyframesPerSec: loadPreviewKeyframeRate(),
};

const monitorConfigSlice = createSlice({
  name: 'monitorConfig',
  initialState,
  reducers: {
    setMonitorConfig: (state, action: PayloadAction<MonitorIntervals>) => {
      state.intervals = action.payload;
    },
    setServerProtocolVersion: (
      state,
      action: PayloadAction<number | undefined>,
    ) => {
      state.serverProtocolVersion = action.payload;
    },
    setPreviewMaxKeyframesPerSec: (
      state,
      action: PayloadAction<PreviewKeyframeRate>,
    ) => {
      state.previewMaxKeyframesPerSec = action.payload;
    },
  },
});

export const {
  setMonitorConfig,
  setServerProtocolVersion,
  setPreviewMaxKeyframesPerSec,
} = monitorConfigSlice.actions;
export default monitorConfigSlice.reducer;

/** Listener middleware for localStorage persistence */
export const monitorConfigListenerMiddleware = createListenerMiddleware();

monitorConfigListenerMiddleware.startListening({
  actionCreator: setPreviewMaxKeyframesPerSec,
  effect: (action) => {
    try {
      localStorage.setItem(PREVIEW_KEYFRAME_RATE_KEY, String(action.payload));
    } catch (error) {
      console.error('[monitorConfigSlice] Save failed:', error);
    }
  },
});
