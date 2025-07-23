import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import {
  ConnectionStatus,
  GpacMessage,
  GpacCommunicationError,
} from '@/types/communication';
import { IGpacMessageHandler } from '@/types/communication';
import { setError, setLoading } from '@/store/slices/graphSlice';
import { useGpacService } from '@/hooks/useGpacService';


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
  // Track connection state internally
  const [isConnected, setIsConnected] = useState(false);
  
  // Use service directly as IGpacCommunication
  const communication = useMemo(() => {
    return service;
  }, [service]);

  // Message handler  communication
  const messageHandler = useMemo<IGpacMessageHandler>(
    () => ({
      onMessage(message: GpacMessage) {
        console.log(`[GraphMonitor] Message received`, message);
      },
      onStatusChange(status: ConnectionStatus) {
        dispatch(setLoading(status === ConnectionStatus.CONNECTING));
        setIsConnected(status === ConnectionStatus.CONNECTED);
      },
      onError(gpacError: GpacCommunicationError) {
        console.error('[GraphMonitor] Error:', gpacError);
        setConnectionError(gpacError.message);
        dispatch(setError(gpacError.message));
      },
    }),
    [dispatch, setConnectionError]
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
    let isMounted = true;
    
    // Try to connect to the service
    const connectToService = async () => {
      try {
        console.log('[useGraphConnection] Checking existing connection...');
        
        // Check if already connected to avoid multiple connections
        if (service.isConnected()) {
          console.log('[useGraphConnection] Already connected, skipping connection attempt');
          if (isMounted) {
            setConnectionError(null);
            setIsConnected(true);
          }
          return;
        }
        
        console.log('[useGraphConnection] Connecting to GPAC...');
        await service.connectService();
        
        if (isMounted) {
          console.log('[useGraphConnection] Connected to GPAC');
          setConnectionError(null);
        }
      } catch (error) {
        if (isMounted) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
          console.error('[useGraphConnection] Connection error:', errorMessage);
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
          console.log('[useGraphConnection] Disconnected from GPAC');
        } catch (err) {
          console.error('[useGraphConnection] Error during disconnect:', err);
        }
      }
    };
  }, [service, setConnectionError, isConnected]);

  // Function to retry connection
  const retryConnection = useCallback(() => {
    setConnectionError(null);
    
    try {
      service.connectService()
        .then(() => {
          console.log('[useGraphConnection] Retry connection success');
          setConnectionError(null);
        })
        .catch((err: Error) => {
          console.error('[useGraphConnection] Retry connection failed:', err);
          setConnectionError(err.message);
        });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retry connection';
      console.error('[useGraphConnection] Error initiating retry:', errorMessage);
      setConnectionError(errorMessage);
    }
  }, [communication, setConnectionError]);
  
  return { retryConnection, isConnected };
};