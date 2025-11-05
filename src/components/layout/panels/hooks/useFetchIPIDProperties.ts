import { useState, useEffect } from 'react';
import { useGpacService } from '@/shared/hooks/useGpacService';
import { PidProperty } from '@/types';

/**
 * Custom hook to fetch PID properties
 */
export const useFetchIPIDProperties = (filterIdx: number | undefined, ipidIdx: number | undefined) => {
  const gpacService = useGpacService();
  const [properties, setProperties] = useState<PidProperty[]>([]);

  useEffect(() => {
    if (filterIdx === undefined || ipidIdx === undefined) {
      setProperties([]);
      return;
    }

    const fetchProperties = async () => {
      const props = await gpacService.getPidProps(filterIdx, ipidIdx);
      setProperties(props);
    };

    fetchProperties();
  }, [filterIdx, ipidIdx, gpacService]);

  return properties;
};
