import { useState, useEffect, useCallback } from 'react';
import { Task } from '../types';
import { getAllTasks, getTasksByVolunteer } from '../lib/firestore';

interface Filters {
  volunteerId?: string;
}

export function useTasks(filters?: Filters) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = filters?.volunteerId
        ? await getTasksByVolunteer(filters.volunteerId)
        : await getAllTasks();
      setTasks(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters?.volunteerId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { tasks, loading, error, refetch: fetch };
}
