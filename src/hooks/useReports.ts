import { useState, useEffect, useCallback } from 'react';
import { FieldReport } from '../types';
import { getAllReports, getReportsByNGO, getReportsByCommunity } from '../lib/firestore';

interface Filters {
  ngoId?: string;
  communityId?: string;
}

export function useReports(filters?: Filters) {
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      let data: FieldReport[];
      if (filters?.ngoId) {
        data = await getReportsByNGO(filters.ngoId);
      } else if (filters?.communityId) {
        data = await getReportsByCommunity(filters.communityId);
      } else {
        data = await getAllReports();
      }
      setReports(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters?.ngoId, filters?.communityId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { reports, loading, error, refetch: fetch };
}
