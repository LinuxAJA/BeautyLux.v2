import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

/**
 * Página actual de un listado público, guardada en la URL (`?pagina=2`) para
 * que se pueda compartir y que el botón "atrás" del navegador la respete.
 * Misma forma que `usePagination`: `withReset(setter)` devuelve un setter que
 * además vuelve a la página 1.
 */
function useUrlPage(param = 'pagina') {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number.parseInt(searchParams.get(param) ?? '', 10) || 1);

  const setPage = useCallback(
    (next) => {
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        if (next > 1) params.set(param, String(next));
        else params.delete(param);
        return params;
      });
    },
    [param, setSearchParams],
  );

  const withReset = useCallback(
    (setter) => (value) => {
      setter(value);
      setPage(1);
    },
    [setPage],
  );

  return { page, setPage, withReset };
}

export default useUrlPage;
