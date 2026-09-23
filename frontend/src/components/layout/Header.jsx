import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { Menu, Search, ShoppingBag } from 'lucide-react';

import BrandLogo from '../ui/BrandLogo';
import Button from '../ui/Button';
import MobileMenu from './MobileMenu';
import UserMenu from './UserMenu';
import { mainNavLinks } from '../../data/navLinks';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // El header se vuelve opaco al bajar, para no competir con el hero.
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16);

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <div className="gold-gradient text-foreground">
        <p className="container-app py-2 text-center text-xs font-medium sm:text-sm">
          Envío gratis en compras superiores a $150.000
        </p>
      </div>

      <header
        className={cn(
          'sticky top-0 z-50 smooth-transition',
          isScrolled
            ? 'bg-background/90 backdrop-blur-lg shadow-card'
            : 'bg-background/40 backdrop-blur-sm',
        )}
      >
        <div className="container-app flex h-18 items-center justify-between gap-4 py-3">
          <Link to="/" className="inline-flex" aria-label="BeautyLux, ir al inicio">
            <BrandLogo />
          </Link>

          <nav className="hidden md:flex md:items-center md:gap-1" aria-label="Navegación principal">
            {mainNavLinks.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'relative rounded-md px-3 py-2 text-sm font-medium smooth-transition',
                    'after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:smooth-transition',
                    isActive
                      ? 'text-primary after:scale-x-100'
                      : 'text-foreground/80 hover:text-primary after:scale-x-0',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" aria-label="Buscar productos" className="hidden sm:inline-flex">
              <Search />
            </Button>

            <Button variant="ghost" size="icon" aria-label="Ver bolsa de compras" className="relative">
              <ShoppingBag />
              <span className="absolute -right-0.5 -top-0.5 flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                0
              </span>
            </Button>

            {isAuthenticated ? (
              <div className="hidden md:flex">
                <UserMenu />
              </div>
            ) : (
              <Button
                variant="gradient"
                size="sm"
                className="hidden md:inline-flex"
                onClick={() => navigate('/login')}
              >
                Iniciar sesión
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Abrir menú de navegación"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu />
            </Button>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onLogout={handleLogout}
      />
    </>
  );
}

export default Header;
