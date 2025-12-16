import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import {
  ConnectionStatus,
  GpacCommunicationError,
} from '@/types/communication';
import { IGpacMessageHandler } from '@/types/communication';
import { setError, setLoading } from '@/shared/store/slices/graphSlice';
import { useGpacService } from '@/shared/hooks/useGpacService';
import { selectActiveConnection } from '@/shared/store/selectors';

interface UseGraphConnectionProps {
  setConnectionError: (error: string | null) => void;
}

/**
 * Hook for managing  connection to GPAC service
 * Handles connection, reconnection, and message processing
 */
export const useGraphConnection = ({
  setConnectionError,
}: UseGraphConnectionProps) => {
  const dispatch = useAppDispatch();
  const service = useGpacService();
  const activeConnection = useAppSelector(selectActiveConnection);
  // Track connection state internally
  const [isConnected, setIsConnected] = useState(false);

  // Use service directly as IGpacCommunication
  const communication = useMemo(() => {
    return service;
  }, [service]);

  // Message handler  communication
  const messageHandler = useMemo<IGpacMessageHandler>(
    () => ({
      onMessage() {},
      onStatusChange(status: ConnectionStatus) {
        dispatch(setLoading(status === ConnectionStatus.CONNECTING));
        setIsConnected(status === ConnectionStatus.CONNECTED);
      },
      onError(gpacError: GpacCommunicationError) {
        setConnectionError(gpacError.message);
        dispatch(setError(gpacError.message));
      },
    }),
    [dispatch, setConnectionError],
  );

  // Register message handler - do this outside the connection effect
  useEffect(() => {
    // Register the handler and store the unregister function
    const unregister = communication.registerHandler(messageHandler);
    return () => {
      // Clean up the handler on unmount
      unregister();
    };
  }, [communication, messageHandler]);

  // Separate effect for establishing connection
  useEffect(() => {
    if (!activeConnection) {
      setConnectionError('No active connection selected');
      return;
    }

    let isMounted = true;

    // Try to connect to the service
    const connectToService = async () => {
      try {
        // Check if already connected to avoid multiple connections
        if (service.isConnected()) {
          if (isMounted) {
            setConnectionError(null);
            setIsConnected(true);
          }
          return;
        }

        await service.connectService(activeConnection.address);

        if (isMounted) {
          setConnectionError(null);
        }
      } catch (error) {
        if (isMounted) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown connection error';
          setConnectionError(errorMessage);
        }
      }
    };

    // Start connection
    connectToService();

    // Cleanup function
    return () => {
      isMounted = false;

      // Only disconnect if we were connected
      if (isConnected) {
        try {
          service.disconnect();
        } catch (err) {
          console.error(err);
        }
      }
    };
  }, [service, setConnectionError, isConnected, activeConnection]);

  // Function to retry connection
  const retryConnection = useCallback(() => {
    if (!activeConnection) {
      setConnectionError('No active connection selected');
      return;
    }

    setConnectionError(null);

    try {
      service
        .connectService(activeConnection.address)
        .then(() => {
          setConnectionError(null);
        })
        .catch((err: Error) => {
          setConnectionError(err.message);
        });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to retry connection';
      setConnectionError(errorMessage);
    }
  }, [service, setConnectionError, activeConnection]);

  return { retryConnection, isConnected };
};
