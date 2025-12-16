import { RootState } from '../index';
import { GpacConnectionConfig } from '@/types/connection';

/** Select connections slice */
const selectConnectionsSlice = (state: RootState) => state.connections;

/** Select connections by ID */
export const selectConnectionsById = (state: RootState) =>
  selectConnectionsSlice(state).connectionsById;

/** Select all connections as array */
export const selectAllConnections = (
  state: RootState,
): GpacConnectionConfig[] => Object.values(selectConnectionsById(state));

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

/** Count total connections */
export const selectConnectionsCount = (state: RootState): number =>
  Object.keys(selectConnectionsById(state)).length;
