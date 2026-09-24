import { useMemo, useState } from 'react';
import { CalendarDays, Package, Receipt, ShoppingBag, Users, Wrench } from 'lucide-react';

import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import ChartCard from '../../../components/dashboard/ChartCard';
import DashboardFilters from '../../../components/dashboard/DashboardFilters';
import DataTable from '../../../components/dashboard/DataTable';
import SalesBarChart from '../../../components/dashboard/SalesBarChart';
import SalesLineChart from '../../../components/dashboard/SalesLineChart';
import StatCard from '../../../components/dashboard/StatCard';
import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../hooks/useAuth';
import * as salesService from '../../../services/sales.service';
import * as statsService from '../../../services/stats.service';
import { formatPrice } from '../../../data/products';

const EMPTY_FILTERS = { dateFrom: '', dateTo: '', productId: '', serviceId: '', status: '', clientId: '' };

const GROUP_BY_OPTIONS = [
  { value: 'day', label: 'Por día' },
  { value: 'week', label: 'Por semana' },
  { value: 'month', label: 'Por mes' },
];

const TOP_TYPE_OPTIONS = [
  { value: 'product', label: 'Productos' },
  { value: 'service', label: 'Servicios' },
];

const STATUS_LABELS = {
  pending: 'Pendiente',
  paid: 'Pagado',
  processing: 'En preparación',
  completed: 'Entregado',
  cancelled: 'Cancelado',
};

/**
 * Resumen del administrador: seis cards, gráfica de barras (artículos más
 * vendidos), gráfica lineal (ventas en el tiempo) y la tabla de últimas
 * ventas, las tres últimas gobernadas por la misma barra de filtros
 * (requisito 13). Ningún número se calcula en el frontend: todo viene de
 * `GET /api/stats/*` y `GET /api/sales` ya agregado (requisito 15).
 */
function AdminOverview() {
  const { user } = useAuth();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [groupBy, setGroupBy] = useState('day');
  const [topType, setTopType] = useState('product');

  const { data: overview } = useApi(() => statsService.getOverview(), []);

  const { data: series, isLoading: isLoadingSeries } = useApi(
    () => statsService.getSalesSeries({ groupBy, ...filters }),
    [groupBy, filters],
  );

  const { data: topItems, isLoading: isLoadingTop } = useApi(
    () =>
      statsService.getTopItems({
        type: topType,
        limit: 5,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        status: filters.status,
        clientId: filters.clientId,
      }),
    [topType, filters.dateFrom, filters.dateTo, filters.status, filters.clientId],
  );

  const {
    data: recentSales,
    isLoading: isLoadingSales,
    error: salesError,
  } = useApi(
    () => salesService.listSales({ ...filters, perPage: 10, orderBy: 'soldAt', orderDir: 'desc' }),
    [filters],
  );

  const salesColumns = useMemo(
    () => [
      { key: 'saleNumber', header: 'Venta' },
      { key: 'soldAt', header: 'Fecha', render: (row) => row.soldAt?.slice(0, 10) },
      {
        key: 'customer',
        header: 'Cliente',
        render: (row) => `${row.customer.firstName} ${row.customer.lastName}`,
      },
      { key: 'channel', header: 'Canal', render: (row) => (row.channel === 'pos' ? 'Mostrador' : 'En línea') },
      { key: 'total', header: 'Total', render: (row) => formatPrice(row.total) },
      {
        key: 'status',
        header: 'Estado',
        render: (row) => (
          <Badge variant={row.status === 'cancelled' ? 'muted' : 'soft'}>
            {STATUS_LABELS[row.status] ?? row.status}
          </Badge>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Hola, {user.firstName}</h1>
        <p className="text-sm text-muted-foreground">Resumen general de BeautyLux.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 2xl:grid-cols-6">
        <StatCard icon={Users} label="Usuarios registrados" value={overview?.usersCount} />
        <StatCard icon={Package} label="Productos activos" value={overview?.productsCount} />
        <StatCard icon={Wrench} label="Servicios activos" value={overview?.servicesCount} />
        <StatCard icon={ShoppingBag} label="Ventas registradas" value={overview?.salesCount} />
        <StatCard
          icon={Receipt}
          label="Facturación"
          value={overview ? formatPrice(overview.invoicesTotal) : undefined}
        />
        <StatCard icon={CalendarDays} label="Citas de hoy" value={overview?.appointmentsToday} />
      </div>

      <DashboardFilters value={filters} onChange={setFilters} onClear={() => setFilters(EMPTY_FILTERS)} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Más vendidos"
          subtitle="Los 5 artículos con mayor facturación en el rango filtrado."
          isEmpty={!isLoadingTop && (topItems ?? []).length === 0}
        >
          <div className="mb-3 flex gap-1">
            {TOP_TYPE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={topType === option.value ? 'gradient' : 'outline'}
                size="sm"
                aria-pressed={topType === option.value}
                onClick={() => setTopType(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          {!isLoadingTop && (topItems ?? []).length > 0 && <SalesBarChart data={topItems} />}
        </ChartCard>

        <ChartCard
          title="Ventas en el tiempo"
          subtitle="Ingresos por período, excluye ventas canceladas."
          isEmpty={!isLoadingSeries && (series ?? []).length === 0}
        >
          <div className="mb-3 flex gap-1">
            {GROUP_BY_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={groupBy === option.value ? 'gradient' : 'outline'}
                size="sm"
                aria-pressed={groupBy === option.value}
                onClick={() => setGroupBy(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          {!isLoadingSeries && (series ?? []).length > 0 && <SalesLineChart data={series} />}
        </ChartCard>
      </div>

      <div>
        <h2 className="mb-3 font-serif text-lg font-semibold">Últimas ventas</h2>
        <DataTable
          columns={salesColumns}
          rows={recentSales ?? []}
          isLoading={isLoadingSales}
          error={salesError}
          emptyMessage="No hay ventas con estos filtros."
        />
      </div>
    </div>
  );
}

export default AdminOverview;
