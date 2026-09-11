import { useMemo, useState } from 'react';
import { Pencil, Plus, PowerOff, Trash2 } from 'lucide-react';

import Button from '../ui/Button';
import ConfirmDialog from './ConfirmDialog';
import DataTable from './DataTable';
import ServiceFormModal from './ServiceFormModal';
import StatusBadge from './StatusBadge';
import { useApi } from '../../hooks/useApi';
import * as servicesService from '../../services/services.service';
import { formatPrice } from '../../data/products';

function ServicesManager({ canDelete = true }) {
  const [search, setSearch] = useState('');
  const [modalService, setModalService] = useState(undefined);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isActing, setIsActing] = useState(false);

  const { data, isLoading, error, refetch } = useApi(
    () => servicesService.listServices({ search, perPage: 50 }),
    [search],
  );

  const rows = useMemo(() => data ?? [], [data]);

  const handleCreateOrUpdate = async (formValues) => {
    if (modalService) {
      await servicesService.updateService(modalService.id, formValues);
    } else {
      await servicesService.createService(formValues);
    }
    await refetch();
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    setIsActing(true);
    setActionError(null);
    try {
      if (pendingAction.type === 'delete') {
        await servicesService.deleteService(pendingAction.service.id);
      } else {
        await servicesService.updateServiceStatus(pendingAction.service.id, pendingAction.nextStatus);
      }
      await refetch();
      setPendingAction(null);
    } catch (error) {
      setActionError(error.message ?? 'No se pudo completar la acción.');
    } finally {
      setIsActing(false);
    }
  };

  const closeActionDialog = () => {
    setPendingAction(null);
    setActionError(null);
  };

  const columns = [
    { key: 'name', header: 'Servicio' },
    { key: 'category', header: 'Categoría', render: (row) => row.category?.name ?? '—' },
    { key: 'price', header: 'Precio', render: (row) => formatPrice(row.price) },
    { key: 'duration', header: 'Duración', render: (row) => `${row.durationMinutes} min` },
    { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => setModalService(row)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cambiar estado"
            onClick={() =>
              setPendingAction({
                type: 'status',
                service: row,
                nextStatus: row.status === 'active' ? 'inactive' : 'active',
              })
            }
          >
            <PowerOff className="size-4" />
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Eliminar"
              onClick={() => setPendingAction({ type: 'delete', service: row })}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold">Servicios</h1>
        <Button variant="gradient" onClick={() => setModalService(null)}>
          <Plus />
          Agregar servicio
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        error={error}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre..."
        emptyMessage="No hay servicios para mostrar."
      />

      <ServiceFormModal
        isOpen={modalService !== undefined}
        onClose={() => setModalService(undefined)}
        onSubmit={handleCreateOrUpdate}
        initialService={modalService}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingAction)}
        onClose={closeActionDialog}
        onConfirm={confirmAction}
        isLoading={isActing}
        error={actionError}
        title={pendingAction?.type === 'delete' ? 'Eliminar servicio' : 'Cambiar estado'}
        confirmLabel={pendingAction?.type === 'delete' ? 'Eliminar' : 'Confirmar'}
        description={
          pendingAction?.type === 'delete'
            ? `¿Eliminar "${pendingAction?.service.name}"? Se ocultará del catálogo.`
            : `¿Cambiar el estado de "${pendingAction?.service.name}" a "${pendingAction?.nextStatus === 'active' ? 'Activo' : 'Inactivo'}"?`
        }
      />
    </div>
  );
}

export default ServicesManager;
