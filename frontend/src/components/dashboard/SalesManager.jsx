import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRightLeft, Eye } from 'lucide-react';

import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Input from '../ui/Input';
import DashboardFilters from './DashboardFilters';
import DataTable from './DataTable';
import SaleStatusModal from './SaleStatusModal';
import PageHeader from './PageHeader';
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

// Una venta en estos estados ya no cambia (el backend lo rechaza).
const FINAL_STATUSES = ['completed', 'cancelled'];

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
 *
 * Desde aquí el personal confirma el pago de las ventas en línea, que el
 * checkout deja pendientes: marcarlas como pagadas emite la factura.
 */
function SalesManager() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [statusSale, setStatusSale] = useState(null);
  const [notice, setNotice] = useState(null);

  const { data, isLoading, error, refetch } = useApi(
    () => salesService.listSales({ search, ...filters, perPage: 50, orderBy: 'soldAt', orderDir: 'desc' }),
    [search, filters],
  );

  const rows = useMemo(() => data ?? [], [data]);

  const { minTotal, maxTotal, ...baseFilters } = filters;
  const setBaseFilters = (next) => setFilters({ ...next, minTotal, maxTotal });

  const handleSaveStatus = async (saleId, status) => {
    const { data: updated } = await salesService.updateSaleStatus(saleId, status);
    setNotice(
      status === 'paid'
        ? `La venta ${updated.saleNumber} quedó pagada: se emitió la factura y se envió al cliente.`
        : `La venta ${updated.saleNumber} quedó en estado «${STATUS_LABELS[status] ?? status}».`,
    );
    refetch();
  };

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
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Ver el detalle de la venta ${row.saleNumber}`}
            onClick={() => navigate(`/pedido/${row.saleNumber}`)}
          >
            <Eye className="size-4" />
          </Button>
          {!FINAL_STATUSES.includes(row.status) && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Cambiar el estado de la venta ${row.saleNumber}`}
              onClick={() => setStatusSale(row)}
            >
              <ArrowRightLeft className="size-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Historial de ventas"
        description="Ventas en línea y del mostrador. Marca como pagadas las ventas en línea para emitir su factura."
      />

      {notice && (
        <p aria-live="polite" className="rounded-lg bg-blush/40 p-3 text-sm text-foreground">
          {notice}
        </p>
      )}

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

      <SaleStatusModal
        isOpen={statusSale !== null}
        onClose={() => setStatusSale(null)}
        sale={statusSale}
        onSave={handleSaveStatus}
      />
    </div>
  );
}

export default SalesManager;
