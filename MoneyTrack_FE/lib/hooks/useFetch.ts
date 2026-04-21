'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useFetch<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[] = []
): UseFetchState<T> & { refetch: () => void } {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const execute = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetchFnRef.current();
      setState({ data, loading: false, error: null });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Đã xảy ra lỗi';
      setState({ data: null, loading: false, error: message });
    }
  }, []);

  useEffect(() => {
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, refetch: execute };
}
