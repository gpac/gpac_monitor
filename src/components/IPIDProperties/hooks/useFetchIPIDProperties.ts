import { useState, useEffect, useMemo } from 'react';
import { useGpacService } from '@/shared/hooks/useGpacService';
import { useAppSelector } from '@/shared/hooks/redux';
import { PidProperty } from '@/types';

/**
 * Custom hook to fetch PID properties
 * Re-fetches when the filter's IPID keys change 
 */
export const useFetchIPIDProperties = (
  filterIdx: number | undefined,
  ipidIdx: number | undefined,
) => {
  const gpacService = useGpacService();
  const [properties, setProperties] = useState<PidProperty[]>([]);
  const filters = useAppSelector((state) => state.graph.filters);

  // Fingerprint of the filter's IPID keys — changes on source switch
  const ipidFingerprint = useMemo(() => {
    if (filterIdx === undefined) return '';
    const filter = filters.find((f) => f.idx === filterIdx);
    if (!filter) return '';
    return Object.keys(filter.ipid).join(',');
  }, [filters, filterIdx]);

  useEffect(() => {
    if (filterIdx === undefined || ipidIdx === undefined) {
      setProperties([]);
      return;
    }

    let cancelled = false;
    const fetchWithRetry = async () => {
      for (const delay of [0, 800]) {
        if (delay > 0) await new Promise((r) => setTimeout(r, delay));
        if (cancelled) return;

        const props = await gpacService.getPidProps(filterIdx, ipidIdx);
        if (cancelled) return;
        setProperties(props);
      }
    };

    fetchWithRetry();
    return () => { cancelled = true; };
  }, [filterIdx, ipidIdx, gpacService, ipidFingerprint]);

  return properties;
};
