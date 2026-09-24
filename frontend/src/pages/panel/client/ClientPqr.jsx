import { useMemo, useState } from 'react';
import { Eye } from 'lucide-react';

import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import DataTable from '../../../components/dashboard/DataTable';
import PqrStatusBadge from '../../../components/dashboard/PqrStatusBadge';
import { useApi } from '../../../hooks/useApi';
import * as pqrService from '../../../services/pqr.service';
import { pqrTypes } from '../../../data/documentTypes';

/**
 * "Mis PQR" del panel del cliente: solo lectura, `GET /api/pqr` ya devuelve
 * únicamente las suyas cuando el rol es `client`.
 */
function ClientPqr() {
  const [search, setSearch] = useState('');
  const [detailPqr, setDetailPqr] = useState(undefined);

  const { data, isLoading, error } = useApi(
    () => pqrService.listPqr({ search, perPage: 50, orderBy: 'createdAt', orderDir: 'desc' }),
    [search],
  );

  const rows = useMemo(() => data ?? [], [data]);

  const columns = [
    { key: 'ticketNumber', header: 'Ticket' },
    {
      key: 'type',
      header: 'Tipo',
      render: (row) => pqrTypes.find((option) => option.value === row.type)?.label ?? row.type,
    },
    { key: 'subject', header: 'Asunto' },
    { key: 'createdAt', header: 'Radicada', render: (row) => row.createdAt?.slice(0, 10) },
    { key: 'status', header: 'Estado', render: (row) => <PqrStatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Ver el detalle de la PQR ${row.ticketNumber}`}
          onClick={() => setDetailPqr(row)}
        >
          <Eye className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl font-semibold">Mis PQR</h1>

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        error={error}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por ticket o asunto..."
        emptyMessage="Todavía no has radicado ninguna PQR."
      />

      <Modal
        isOpen={detailPqr !== undefined}
        onClose={() => setDetailPqr(undefined)}
        title={detailPqr?.ticketNumber}
        description={detailPqr?.subject}
      >
        {detailPqr && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <PqrStatusBadge status={detailPqr.status} />
              <span className="text-xs text-muted-foreground">{detailPqr.createdAt?.slice(0, 10)}</span>
            </div>

            <p className="text-sm leading-relaxed">{detailPqr.message}</p>

            {detailPqr.response ? (
              <div className="rounded-lg bg-blush/30 p-4">
                <p className="label-caps mb-1 text-muted-foreground">Respuesta de BeautyLux</p>
                <p className="text-sm leading-relaxed">{detailPqr.response}</p>
              </div>
            ) : (
              <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
                Todavía no tiene respuesta. Nuestro equipo te escribirá lo antes posible.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ClientPqr;
