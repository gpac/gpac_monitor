import { createSelector } from '@reduxjs/toolkit';
import {
  selectCurrentTool,
  selectLevelsByTool,
  selectDefaultAllLevel,
  selectVisibleToolsFilter,
} from './logsSelectors';

/** Get current logs configuration for localStorage persistence */
export const selectCurrentConfig = createSelector(
  [
    selectCurrentTool,
    selectLevelsByTool,
    selectDefaultAllLevel,
    selectVisibleToolsFilter,
  ],
  (currentTool, levelsByTool, defaultAllLevel, visibleToolsFilter) => ({
    currentTool,
    levelsByTool,
    defaultAllLevel,
    visibleToolsFilter,
  }),
);
