import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye } from 'lucide-react';

import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import DataTable from '../../../components/dashboard/DataTable';
import InvoiceDownloadButton from '../../../components/common/InvoiceDownloadButton';
import { useApi } from '../../../hooks/useApi';
import * as salesService from '../../../services/sales.service';
import { formatPrice } from '../../../data/products';

const STATUS_LABELS = {
  pending: 'Pendiente',
  paid: 'Pagado',
  processing: 'En preparación',
  completed: 'Entregado',
  cancelled: 'Cancelado',
};

/**
 * "Mis pedidos" del panel del cliente.
 *
 * No hace falta filtrar por usuario: `GET /api/sales` ya devuelve solo las
 * ventas de quien pregunta cuando el rol es `client`.
 */
function ClientOrders() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { data, isLoading, error } = useApi(
    () => salesService.listSales({ search, perPage: 50, orderBy: 'soldAt', orderDir: 'desc' }),
    [search],
  );

  const rows = useMemo(() => data ?? [], [data]);

  const columns = [
    { key: 'saleNumber', header: 'Pedido' },
    { key: 'soldAt', header: 'Fecha', render: (row) => row.soldAt?.slice(0, 10) },
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
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Ver el pedido ${row.saleNumber}`}
            onClick={() => navigate(`/pedido/${row.saleNumber}`)}
          >
            <Eye className="size-4" />
          </Button>
          {/* Una venta pendiente todavía no tiene factura: sin consulta de
              más, ya se sabe que no habría nada que mostrar. */}
          {row.status !== 'pending' && (
            <InvoiceDownloadButton saleId={row.id} label="Factura" variant="ghost" />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl font-semibold">Mis pedidos</h1>

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        error={error}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por número de pedido..."
        emptyMessage="Todavía no has hecho ningún pedido."
      />
    </div>
  );
}

export default ClientOrders;
