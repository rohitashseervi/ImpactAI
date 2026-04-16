import { useState, useEffect, useCallback } from 'react';
import { Volunteer } from '../types';
import { getAllActiveVolunteers } from '../lib/firestore';

export function useVolunteers() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllActiveVolunteers();
      setVolunteers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { volunteers, loading, error, refetch: fetch };
}
