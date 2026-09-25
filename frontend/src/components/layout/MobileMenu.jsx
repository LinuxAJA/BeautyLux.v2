import { useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { LogOut, User, X } from 'lucide-react';

import BrandLogo from '../ui/BrandLogo';
import Button from '../ui/Button';
import { accountShortcuts, mainNavLinks } from '../../data/navLinks';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';

/** Panel de navegación deslizante para pantallas pequeñas. */
function MobileMenu({ isOpen, onClose, onLogout }) {
  const { user, isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Cierra el menú al navegar a otra ruta.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Cierre con Escape y bloqueo del scroll de fondo mientras está abierto.
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div
      className={cn('fixed inset-0 z-60 lg:hidden', isOpen ? 'visible' : 'invisible')}
      aria-hidden={!isOpen}
    >
      <div
        className={cn(
          'absolute inset-0 bg-foreground/40 backdrop-blur-sm smooth-transition',
          isOpen ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className={cn(
          'absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col bg-background shadow-elegant smooth-transition',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <BrandLogo size="sm" withClaim={false} />
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar menú">
            <X />
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-4" aria-label="Navegación móvil">
          {mainNavLinks.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-3 text-base font-medium smooth-transition',
                  isActive ? 'bg-blush/40 text-primary' : 'text-foreground/80 hover:bg-muted',
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          {isAuthenticated ? (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm font-medium">
                <User className="size-4 text-primary" aria-hidden="true" />
                {user.firstName} {user.lastName}
              </p>
              <Button variant="outline" fullWidth onClick={() => navigate('/panel')}>
                Mi panel
              </Button>
              <ul className="grid gap-1" aria-label="Atajos de tu cuenta">
                {(accountShortcuts[user.role.name] ?? []).map(({ label, to }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 smooth-transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
              <Button variant="outline" fullWidth onClick={onLogout}>
                <LogOut />
                Cerrar sesión
              </Button>
            </div>
          ) : (
            <Button variant="gradient" fullWidth onClick={() => navigate('/login')}>
              Iniciar sesión
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}

export default MobileMenu;
