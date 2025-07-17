import { useEffect } from 'react';
import { Node } from '@xyflow/react';

interface UseGraphNotificationsProps {
  nodes: Node[];
  error: string | null;
  isLoading: boolean;
  toast: any; // Type should match your toast implementation
}

/**
 * Hook for managing notification system for graph events
 * Displays toast notifications for important events
 */
export const useGraphNotifications = ({
  nodes,
  error,
  isLoading,
  toast
}: UseGraphNotificationsProps) => {
  // Notification for successful graph loading
  useEffect(() => {
    if (nodes.length > 0 && !isLoading) {
      toast({
        title: 'Graph loaded',
        description: `${nodes.length} node${nodes.length !== 1 ? 's' : ''} have been loaded`,
        variant: 'default',
      });
    }
  }, [nodes.length, isLoading, toast]);

  // Notification for errors
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);
  
  return {};
};