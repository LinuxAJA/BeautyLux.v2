import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * Lleva la ventana al inicio cada vez que cambia la ruta.
 * Sin esto, al navegar entre páginas se conserva el scroll anterior.
 */
export function useScrollTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
}

export default useScrollTop;
