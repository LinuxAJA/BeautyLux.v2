import { useCallback, useState } from 'react';

/**
 * Página actual de un listado paginado por la API.
 *
 * `withReset(setter)` envuelve el setter de un filtro o de la búsqueda para
 * que, al cambiarlo, el listado vuelva a la página 1 en el mismo render (sin
 * un efecto que pediría la página vieja primero y la nueva después).
 */
function usePagination(initialPage = 1) {
  const [page, setPage] = useState(initialPage);

  const withReset = useCallback(
    (setter) =>
      (value) => {
        setter(value);
        setPage(1);
      },
    [],
  );

  return { page, setPage, withReset };
}

export default usePagination;
