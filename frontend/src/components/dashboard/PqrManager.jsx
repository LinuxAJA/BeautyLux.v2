import { useMemo, useState } from 'react';
import { MessageSquareReply } from 'lucide-react';

import Button from '../ui/Button';
import DataTable from './DataTable';
import PqrResponseModal from './PqrResponseModal';
import PqrStatusBadge from './PqrStatusBadge';
import { useApi } from '../../hooks/useApi';
import * as pqrService from '../../services/pqr.service';
import { pqrTypes } from '../../data/documentTypes';

const STATUS_FILTERS = [
  { value: '', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'in_progress', label: 'En proceso' },
  { value: 'answered', label: 'Respondidas' },
  { value: 'closed', label: 'Cerradas' },
];

/**
 * PQR del panel de personal: `/panel/admin/pqr` y `/panel/empleado/pqr`.
 * Replica el molde de `AppointmentsManager`: `DataTable` + un modal propio,
 * con la convención `undefined` = cerrado / objeto = trabajando sobre esa fila.
 */
function PqrManager() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modalPqr, setModalPqr] = useState(undefined);

  const { data, isLoading, error, refetch } = useApi(
    () =>
      pqrService.listPqr({
        search,
        status,
        perPage: 50,
        orderBy: 'createdAt',
        orderDir: 'desc',
      }),
    [search, status],
  );

  const rows = useMemo(() => data ?? [], [data]);

  const handleUpdateStatus = async (id, nextStatus) => {
    await pqrService.updatePqrStatus(id, nextStatus);
    await refetch();
  };

  const handleRespond = async (id, response) => {
    await pqrService.respondPqr(id, response);
    await refetch();
  };

  const columns = [
    { key: 'ticketNumber', header: 'Ticket' },
    {
      key: 'type',
      header: 'Tipo',
      render: (row) => pqrTypes.find((option) => option.value === row.type)?.label ?? row.type,
    },
    { key: 'subject', header: 'Asunto' },
    {
      key: 'contact',
      header: 'Contacto',
      render: (row) => `${row.contactFirstName} ${row.contactLastName}`,
    },
    { key: 'createdAt', header: 'Radicada', render: (row) => row.createdAt?.slice(0, 10) },
    { key: 'status', header: 'Estado', render: (row) => <PqrStatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Ver y responder la PQR ${row.ticketNumber}`}
          onClick={() => setModalPqr(row)}
        >
          <MessageSquareReply className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl font-semibold">Peticiones, quejas y reclamos</h1>

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        error={error}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por ticket, asunto o contacto..."
        emptyMessage="No hay PQR registradas."
        toolbar={
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrar por estado">
            {STATUS_FILTERS.map((filter) => (
              <Button
                key={filter.value || 'todas'}
                variant={status === filter.value ? 'gradient' : 'outline'}
                size="sm"
                aria-pressed={status === filter.value}
                onClick={() => setStatus(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        }
      />

      <PqrResponseModal
        isOpen={modalPqr !== undefined}
        onClose={() => setModalPqr(undefined)}
        pqr={modalPqr}
        onUpdateStatus={handleUpdateStatus}
        onRespond={handleRespond}
      />
    </div>
  );
}

export default PqrManager;
