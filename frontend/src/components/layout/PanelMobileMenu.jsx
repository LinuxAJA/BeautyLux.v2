import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { X } from 'lucide-react';

import BrandLogo from '../ui/BrandLogo';
import Button from '../ui/Button';
import PanelAccount from './PanelAccount';
import PanelNav from './PanelNav';
import { cn } from '../../utils/cn';

/**
 * Navegación del panel en pantallas pequeñas: la misma que la barra lateral,
 * en un panel que entra por la izquierda. Copia la mecánica de `MobileMenu`
 * (cierre con Escape, al tocar el fondo y al navegar, y scroll de fondo
 * bloqueado mientras está abierto).
 */
function PanelMobileMenu({ id, isOpen, onClose, sections, user, onLogout }) {
  const { pathname } = useLocation();
  const closeButtonRef = useRef(null);

  // Cierra el menú al navegar a otra ruta.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    // El contenedor pasa de `invisible` a `visible` con transición: en este
    // mismo instante sigue oculto y el navegador ignoraría el foco.
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 50);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div className={cn('fixed inset-0 z-60 md:hidden', isOpen ? 'visible' : 'invisible')} aria-hidden={!isOpen}>
      <div
        className={cn(
          'absolute inset-0 bg-foreground/40 backdrop-blur-sm smooth-transition',
          isOpen ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />

      <aside
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label="Menú del panel"
        className={cn(
          'absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-card shadow-elegant smooth-transition',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <Link
            to="/"
            aria-label="BeautyLux, volver al sitio web"
            className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <BrandLogo size="sm" withClaim={false} />
          </Link>
          <Button ref={closeButtonRef} variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar menú">
            <X />
          </Button>
        </div>

        <PanelNav sections={sections} className="flex-1 overflow-y-auto p-3" />
        <PanelAccount user={user} onLogout={onLogout} />
      </aside>
    </div>
  );
}

export default PanelMobileMenu;
