import { useNavigate } from 'react-router';
import { Banknote, CalendarClock, MessageSquare, ShoppingCart } from 'lucide-react';

import Button from '../../../components/ui/Button';
import ChartCard from '../../../components/dashboard/ChartCard';
import PageHeader from '../../../components/dashboard/PageHeader';
import StatCard from '../../../components/dashboard/StatCard';
import SalesLineChart from '../../../components/dashboard/SalesLineChart';
import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../hooks/useAuth';
import * as statsService from '../../../services/stats.service';
import { formatPrice } from '../../../data/products';

/**
 * Resumen del empleado: la jornada de hoy y las ventas del mostrador. Los
 * accesos a cada módulo están en la barra lateral; aquí solo queda el punto
 * de venta como acción principal, que es lo que más se usa en el día.
 */
function EmployeeOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: summary, isLoading: isLoadingSummary } = useApi(() => statsService.getEmployeeSummary(), []);
  const { data: series, isLoading: isLoadingSeries } = useApi(
    () => statsService.getSalesSeries({ groupBy: 'day', channel: 'pos' }),
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hola, ${user.firstName}`}
        description="Tu jornada de hoy en BeautyLux."
        actions={
          <Button variant="gradient" onClick={() => navigate('/panel/empleado/pos')}>
            <ShoppingCart />
            Abrir punto de venta
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ShoppingCart} label="Ventas de hoy" value={summary?.salesTodayCount} isLoading={isLoadingSummary} />
        <StatCard
          icon={Banknote}
          label="Ingresos de hoy"
          value={summary ? formatPrice(summary.salesTodayTotal) : undefined}
          isLoading={isLoadingSummary}
        />
        <StatCard icon={CalendarClock} label="Citas de hoy" value={summary?.appointmentsToday} isLoading={isLoadingSummary} />
        <StatCard icon={MessageSquare} label="PQR asignadas" value={summary?.pqrAssigned} isLoading={isLoadingSummary} />
      </div>

      <ChartCard
        title="Ventas del mostrador"
        subtitle="Punto de venta, por día."
        isLoading={isLoadingSeries}
        isEmpty={(series ?? []).length === 0}
        emptyMessage="Todavía no hay ventas registradas en el punto de venta."
      >
        <SalesLineChart data={series} />
      </ChartCard>
    </div>
  );
}

export default EmployeeOverview;
