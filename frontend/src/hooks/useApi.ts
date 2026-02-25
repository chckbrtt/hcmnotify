import { useState, useEffect, useCallback } from 'react';

export function useApi<T>(url: string, pollMs?: number) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
    if (pollMs) {
      const interval = setInterval(fetchData, pollMs);
      return () => clearInterval(interval);
    }
  }, [fetchData, pollMs]);

  return { data, loading, error, refresh: fetchData };
}
