import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../index';
import { GpacConnectionConfig } from '@/types/connection';
import { ConnectionStatus } from '@/types/communication/shared';

/** Select connections slice */
const selectConnectionsSlice = (state: RootState) => state.connections;

/** Select connections by ID */
export const selectConnectionsById = (state: RootState) =>
  selectConnectionsSlice(state).connectionsById;

/** Select all connections as array (memoized to prevent unnecessary re-renders) */
export const selectAllConnections = createSelector(
  [selectConnectionsById],
  (connectionsById): GpacConnectionConfig[] => Object.values(connectionsById),
);

/** Select active connection ID */
export const selectActiveConnectionId = (state: RootState) =>
  selectConnectionsSlice(state).activeConnectionId;

/** Select active connection */
export const selectActiveConnection = (
  state: RootState,
): GpacConnectionConfig | null => {
  const activeId = selectActiveConnectionId(state);
  if (!activeId) return null;
  return selectConnectionsById(state)[activeId] || null;
};

/** Select connection by ID */
export const selectConnectionById = (id: string) => (state: RootState) =>
  selectConnectionsById(state)[id] || null;

/** Check if has active connection */
export const selectHasActiveConnection = (state: RootState): boolean =>
  selectActiveConnectionId(state) !== null;

/** True when active connection status is CONNECTED */
export const selectIsGpacConnected = (state: RootState): boolean =>
  selectActiveConnection(state)?.status === ConnectionStatus.CONNECTED;

/** Count total connections */
export const selectConnectionsCount = (state: RootState): number =>
  Object.keys(selectConnectionsById(state)).length;
