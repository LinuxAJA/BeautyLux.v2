import { useCallback, useEffect, useState } from 'react';

/**
 * Ejecuta `fetcher` al montar (y cuando cambian `deps`) y expone
 * { data, meta, error, isLoading, refetch } para vistas de solo lectura.
 */
export function useApi(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, meta: null, error: null, isLoading: true });

  const load = useCallback(async () => {
    setState((previous) => ({ ...previous, isLoading: true, error: null }));
    try {
      const response = await fetcher();
      setState({ data: response.data, meta: response.meta ?? null, error: null, isLoading: false });
    } catch (error) {
      setState({ data: null, meta: null, error, isLoading: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  return { ...state, refetch: load };
}

export default useApi;
