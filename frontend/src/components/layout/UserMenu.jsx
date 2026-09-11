import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ChevronDown, LayoutDashboard, LogOut } from 'lucide-react';

import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';

/**
 * Menú desplegable del usuario autenticado, para el navbar público.
 *
 * Un único botón con el nombre reemplaza los dos elementos sueltos que
 * había antes ("Mi panel" y "Salir"): al pulsarlo se despliega un menú con
 * los datos de la cuenta y esas dos acciones.
 */
function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Cierra al hacer clic fuera o al pulsar Escape.
  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Cierra al navegar a otra ruta (p. ej. tras pulsar "Mi panel").
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-foreground/80 smooth-transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {user.firstName?.[0]}
          {user.lastName?.[0]}
        </span>
        <span className="max-w-28 truncate">{user.firstName}</span>
        <ChevronDown
          className={cn('size-3.5 smooth-transition', isOpen && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={`Cuenta de ${user.firstName}`}
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-card p-1.5 shadow-elegant"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-sm font-medium text-foreground">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-xs font-medium text-primary">{user.role.label}</p>
          </div>

          <Link
            to="/panel"
            role="menuitem"
            className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 smooth-transition hover:bg-muted"
          >
            <LayoutDashboard className="size-4" aria-hidden="true" />
            Mi panel
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-destructive smooth-transition hover:bg-destructive/10"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
