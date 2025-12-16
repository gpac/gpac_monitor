import { useEffect } from 'react';
import { gpacService } from '@/services/gpacService';
import { useAppDispatch, useAppSelector } from './redux';
import { selectActiveConnection } from '@/shared/store/selectors';
import { updateConnectionStatus } from '@/shared/store/slices/connectionsSlice';
import { ConnectionStatus } from '@/types/communication/shared';

/**
 * Syncs gpacService connection status with Redux store
 * Only triggers re-renders for the active connection
 */
export const useConnectionStatusSync = () => {
  const dispatch = useAppDispatch();
  const activeConnection = useAppSelector(selectActiveConnection);

  useEffect(() => {
    if (!activeConnection) {
      return;
    }

    const handleStatusChange = (status: ConnectionStatus) => {
      dispatch(
        updateConnectionStatus({
          id: activeConnection.id,
          status,
        }),
      );
    };

    gpacService.onConnectionStatusChange = handleStatusChange;

    return () => {
      gpacService.onConnectionStatusChange = undefined;
    };
  }, [dispatch, activeConnection]);
};
