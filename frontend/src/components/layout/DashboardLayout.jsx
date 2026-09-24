import { NavLink, Outlet, useNavigate } from 'react-router';
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  ListTree,
  MessageSquareWarning,
  Receipt,
  LogOut,
  Package,
  ScrollText,
  ShoppingCart,
  User,
  Users,
  Wrench,
} from 'lucide-react';

import WhatsAppButton from '../common/WhatsAppButton';
import BrandLogo from '../ui/BrandLogo';
import { useAuth } from '../../hooks/useAuth';
import useScrollTop from '../../hooks/useScrollTop';
import { cn } from '../../utils/cn';

const NAV_BY_ROLE = {
  admin: [
    { to: '/panel/admin', label: 'Resumen', icon: LayoutDashboard, end: true },
    { to: '/panel/admin/usuarios', label: 'Usuarios', icon: Users },
    { to: '/panel/admin/productos', label: 'Productos', icon: Package },
    { to: '/panel/admin/servicios', label: 'Servicios', icon: Wrench },
    { to: '/panel/admin/categorias', label: 'Categorías', icon: ListTree },
    { to: '/panel/admin/citas', label: 'Citas', icon: CalendarDays },
    { to: '/panel/admin/pos', label: 'Punto de venta', icon: ShoppingCart },
    { to: '/panel/admin/facturas', label: 'Facturación', icon: Receipt },
    { to: '/panel/admin/reportes', label: 'Reportes', icon: BarChart3 },
    { to: '/panel/admin/pqr', label: 'PQR', icon: MessageSquareWarning },
    { to: '/panel/admin/bitacora', label: 'Bitácora', icon: ScrollText },
  ],
  employee: [
    { to: '/panel/empleado', label: 'Resumen', icon: LayoutDashboard, end: true },
    { to: '/panel/empleado/clientes', label: 'Clientes', icon: Users },
    { to: '/panel/empleado/productos', label: 'Productos', icon: Package },
    { to: '/panel/empleado/servicios', label: 'Servicios', icon: Wrench },
    { to: '/panel/empleado/citas', label: 'Citas', icon: CalendarDays },
    { to: '/panel/empleado/pos', label: 'Punto de venta', icon: ShoppingCart },
    { to: '/panel/empleado/facturas', label: 'Facturación', icon: Receipt },
    { to: '/panel/empleado/pqr', label: 'PQR', icon: MessageSquareWarning },
  ],
  client: [
    { to: '/panel/cliente', label: 'Mi perfil', icon: User, end: true },
    { to: '/panel/cliente/pedidos', label: 'Mis pedidos', icon: Package },
    { to: '/panel/cliente/citas', label: 'Mis citas', icon: CalendarDays },
    { to: '/panel/cliente/pqr', label: 'Mis PQR', icon: MessageSquareWarning },
  ],
};

/** Layout de los paneles autenticados: barra lateral por rol + contenido. */
function DashboardLayout() {
  useScrollTop();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV_BY_ROLE[user.role.name] ?? [];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="border-b border-border p-5">
          <BrandLogo size="sm" withClaim={false} />
        </div>

        <nav className="flex-1 space-y-1 p-4" aria-label="Navegación del panel">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium smooth-transition',
                  isActive ? 'bg-blush/40 text-primary' : 'text-foreground/70 hover:bg-muted',
                )
              }
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <p className="mb-3 truncate text-xs text-muted-foreground">
            {user.firstName} {user.lastName} · {user.role.label}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
          <BrandLogo size="sm" withClaim={false} />
          <button type="button" onClick={handleLogout} className="text-sm font-medium text-destructive">
            Salir
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <WhatsAppButton />
    </div>
  );
}

export default DashboardLayout;
