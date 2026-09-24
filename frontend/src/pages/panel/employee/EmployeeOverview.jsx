import { Link } from 'react-router';
import { ArrowRight, CalendarClock, MessageSquare, Package, ShoppingCart, Users, Wrench } from 'lucide-react';

import ChartCard from '../../../components/dashboard/ChartCard';
import StatCard from '../../../components/dashboard/StatCard';
import SalesLineChart from '../../../components/dashboard/SalesLineChart';
import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../hooks/useAuth';
import * as statsService from '../../../services/stats.service';
import { formatPrice } from '../../../data/products';

const QUICK_LINKS = [
  { to: '/panel/empleado/pos', label: 'Punto de venta', icon: ShoppingCart },
  { to: '/panel/empleado/clientes', label: 'Ver clientes', icon: Users },
  { to: '/panel/empleado/productos', label: 'Gestionar productos', icon: Package },
  { to: '/panel/empleado/servicios', label: 'Gestionar servicios', icon: Wrench },
];

function EmployeeOverview() {
  const { user } = useAuth();
  const { data: summary } = useApi(() => statsService.getEmployeeSummary(), []);
  const { data: series, isLoading: isLoadingSeries } = useApi(
    () => statsService.getSalesSeries({ groupBy: 'day', channel: 'pos' }),
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Hola, {user.firstName}</h1>
        <p className="text-sm text-muted-foreground">
          Desde aquí puedes consultar y editar clientes, y gestionar el catálogo de productos y servicios.
          Los cambios de estado, la eliminación de cuentas y la bitácora son exclusivos del administrador.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ShoppingCart} label="Ventas de hoy" value={summary?.salesTodayCount} />
        <StatCard
          icon={ShoppingCart}
          label="Ingresos de hoy"
          value={summary ? formatPrice(summary.salesTodayTotal) : undefined}
        />
        <StatCard icon={CalendarClock} label="Citas de hoy" value={summary?.appointmentsToday} />
        <StatCard icon={MessageSquare} label="PQR asignadas" value={summary?.pqrAssigned} />
      </div>

      <ChartCard
        title="Ventas del mostrador"
        subtitle="Punto de venta, por día."
        isEmpty={!isLoadingSeries && (series ?? []).length === 0}
        emptyMessage="Todavía no hay ventas registradas en el punto de venta."
      >
        {!isLoadingSeries && (series ?? []).length > 0 && <SalesLineChart data={series} />}
      </ChartCard>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-sm font-medium text-foreground/80 shadow-card smooth-transition hover:border-primary/40 hover:text-primary"
          >
            <span className="flex items-center gap-2.5">
              <Icon className="size-4 text-primary" aria-hidden="true" />
              {label}
            </span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default EmployeeOverview;
