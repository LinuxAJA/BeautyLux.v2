import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  ListTree,
  MessageSquareWarning,
  Package,
  Receipt,
  ScrollText,
  ShoppingBag,
  ShoppingCart,
  User,
  Users,
  Wrench,
} from 'lucide-react';

/**
 * Navegación del panel por rol, agrupada por dominio del negocio. La usan la
 * barra lateral y el menú móvil de `DashboardLayout` (vía `PanelNav`).
 * `end: true` en los resúmenes, para que no queden activos en todas las
 * subrutas del panel.
 */
export const panelNavByRole = {
  admin: [
    {
      label: 'General',
      links: [{ to: '/panel/admin', label: 'Resumen', icon: LayoutDashboard, end: true }],
    },
    {
      label: 'Operación',
      links: [
        { to: '/panel/admin/pos', label: 'Punto de venta', icon: ShoppingCart },
        { to: '/panel/admin/ventas', label: 'Ventas', icon: ShoppingBag },
        { to: '/panel/admin/citas', label: 'Citas', icon: CalendarDays },
        { to: '/panel/admin/facturas', label: 'Facturación', icon: Receipt },
      ],
    },
    {
      label: 'Catálogo',
      links: [
        { to: '/panel/admin/productos', label: 'Productos', icon: Package },
        { to: '/panel/admin/servicios', label: 'Servicios', icon: Wrench },
        { to: '/panel/admin/categorias', label: 'Categorías', icon: ListTree },
      ],
    },
    {
      label: 'Clientes',
      links: [
        { to: '/panel/admin/usuarios', label: 'Usuarios', icon: Users },
        { to: '/panel/admin/pqr', label: 'PQR', icon: MessageSquareWarning },
      ],
    },
    {
      label: 'Análisis y sistema',
      links: [
        { to: '/panel/admin/reportes', label: 'Reportes', icon: BarChart3 },
        { to: '/panel/admin/bitacora', label: 'Bitácora', icon: ScrollText },
      ],
    },
  ],
  employee: [
    {
      label: 'General',
      links: [{ to: '/panel/empleado', label: 'Resumen', icon: LayoutDashboard, end: true }],
    },
    {
      label: 'Operación',
      links: [
        { to: '/panel/empleado/pos', label: 'Punto de venta', icon: ShoppingCart },
        { to: '/panel/empleado/ventas', label: 'Ventas', icon: ShoppingBag },
        { to: '/panel/empleado/citas', label: 'Citas', icon: CalendarDays },
        { to: '/panel/empleado/facturas', label: 'Facturación', icon: Receipt },
      ],
    },
    {
      label: 'Catálogo',
      links: [
        { to: '/panel/empleado/productos', label: 'Productos', icon: Package },
        { to: '/panel/empleado/servicios', label: 'Servicios', icon: Wrench },
      ],
    },
    {
      label: 'Clientes',
      links: [
        { to: '/panel/empleado/clientes', label: 'Clientes', icon: Users },
        { to: '/panel/empleado/pqr', label: 'PQR', icon: MessageSquareWarning },
      ],
    },
  ],
  client: [
    {
      label: 'Mi cuenta',
      links: [{ to: '/panel/cliente', label: 'Mi perfil', icon: User, end: true }],
    },
    {
      label: 'Compras',
      links: [
        { to: '/panel/cliente/pedidos', label: 'Mis pedidos', icon: Package },
        { to: '/panel/cliente/citas', label: 'Mis citas', icon: CalendarDays },
      ],
    },
    {
      label: 'Soporte',
      links: [{ to: '/panel/cliente/pqr', label: 'Mis PQR', icon: MessageSquareWarning }],
    },
  ],
};
