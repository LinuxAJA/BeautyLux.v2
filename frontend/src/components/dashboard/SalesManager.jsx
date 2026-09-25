import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye } from 'lucide-react';

import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Input from '../ui/Input';
import DashboardFilters from './DashboardFilters';
import DataTable from './DataTable';
import { useApi } from '../../hooks/useApi';
import * as salesService from '../../services/sales.service';
import { formatPrice } from '../../data/products';

const EMPTY_FILTERS = {
  dateFrom: '',
  dateTo: '',
  productId: '',
  serviceId: '',
  status: '',
  clientId: '',
  minTotal: '',
  maxTotal: '',
};

const STATUS_LABELS = {
  pending: 'Pendiente',
  paid: 'Pagado',
  processing: 'En preparación',
  completed: 'Entregado',
  cancelled: 'Cancelado',
};

/**
 * Historial de ventas del panel (requisito 3): `/panel/admin/ventas` y
 * `/panel/empleado/ventas`. Reúsa la barra de filtros del dashboard (fecha,
 * producto, servicio, estado, cliente) y le suma el rango de valor; todos
 * los filtros los resuelve `GET /api/sales` en el servidor.
 */
function SalesManager() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const { data, isLoading, error } = useApi(
    () => salesService.listSales({ search, ...filters, perPage: 50, orderBy: 'soldAt', orderDir: 'desc' }),
    [search, filters],
  );

  const rows = useMemo(() => data ?? [], [data]);

  const { minTotal, maxTotal, ...baseFilters } = filters;
  const setBaseFilters = (next) => setFilters({ ...next, minTotal, maxTotal });

  const columns = [
    { key: 'saleNumber', header: 'Venta' },
    { key: 'soldAt', header: 'Fecha', render: (row) => row.soldAt?.slice(0, 10) },
    {
      key: 'customer',
      header: 'Cliente',
      render: (row) => `${row.customer.firstName} ${row.customer.lastName}`,
    },
    { key: 'channel', header: 'Canal', render: (row) => (row.channel === 'pos' ? 'Mostrador' : 'En línea') },
    { key: 'itemsCount', header: 'Artículos' },
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
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Ver el detalle de la venta ${row.saleNumber}`}
          onClick={() => navigate(`/pedido/${row.saleNumber}`)}
        >
          <Eye className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl font-semibold">Historial de ventas</h1>

      <DashboardFilters
        value={baseFilters}
        onChange={setBaseFilters}
        onClear={() => setFilters(EMPTY_FILTERS)}
      />

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <Input
          type="number"
          min="0"
          label="Valor mínimo"
          placeholder="$ 0"
          value={minTotal}
          onChange={(event) => setFilters({ ...filters, minTotal: event.target.value })}
        />
        <Input
          type="number"
          min="0"
          label="Valor máximo"
          placeholder="Sin límite"
          value={maxTotal}
          onChange={(event) => setFilters({ ...filters, maxTotal: event.target.value })}
        />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        error={error}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por número de venta o cliente..."
        emptyMessage="No hay ventas con estos filtros."
      />
    </div>
  );
}

export default SalesManager;
