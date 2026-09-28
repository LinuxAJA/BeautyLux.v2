import { useCallback, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router';
import { Menu } from 'lucide-react';

import FloatingActions from '../chat/FloatingActions';
import BrandLogo from '../ui/BrandLogo';
import Button from '../ui/Button';
import PanelAccount from './PanelAccount';
import PanelMobileMenu from './PanelMobileMenu';
import PanelNav from './PanelNav';
import { useAuth } from '../../hooks/useAuth';
import usePanelNavSections from '../../hooks/usePanelNavSections';
import useScrollTop from '../../hooks/useScrollTop';
import { panelNavByRole } from '../../data/panelNav';

const MOBILE_MENU_ID = 'panel-mobile-menu';

/**
 * Layout de los paneles autenticados: barra lateral por rol + contenido.
 *
 * La barra lateral es `sticky` a la altura de la ventana: no se va con el
 * scroll del contenido y "Cerrar sesión" queda siempre a la vista. Solo la
 * lista de enlaces se desplaza, y únicamente si la pantalla es muy baja. El
 * scroll sigue siendo el de la ventana (del que depende `useScrollTop`).
 */
function DashboardLayout() {
  useScrollTop();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const sections = panelNavByRole[user.role.name] ?? [];
  const { isOpen, toggle, activeLabel } = usePanelNavSections(sections, user.role.name);
  const navProps = { sections, isOpen, onToggle: toggle, activeLabel };

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const homeLink = (
    <Link
      to="/"
      aria-label="BeautyLux, volver al sitio web"
      title="Volver al sitio web"
      className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <BrandLogo size="sm" withClaim={false} />
    </Link>
  );

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="border-b border-border px-5 py-4">{homeLink}</div>
        <PanelNav {...navProps} className="flex-1 overflow-y-auto p-3" />
        <PanelAccount user={user} onLogout={handleLogout} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
          {homeLink}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Abrir el menú del panel"
            aria-expanded={isMenuOpen}
            aria-controls={MOBILE_MENU_ID}
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu />
          </Button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <PanelMobileMenu
        id={MOBILE_MENU_ID}
        isOpen={isMenuOpen}
        onClose={closeMenu}
        navProps={navProps}
        user={user}
        onLogout={handleLogout}
      />
      <FloatingActions />
    </div>
  );
}

export default DashboardLayout;
