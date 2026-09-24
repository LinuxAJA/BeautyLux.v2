import { useMemo, useState } from 'react';
import { CalendarClock, CalendarX, Check, UserX } from 'lucide-react';

import Button from '../ui/Button';
import AppointmentStatusBadge from './AppointmentStatusBadge';
import ConfirmDialog from './ConfirmDialog';
import DataTable from './DataTable';
import RescheduleModal from './RescheduleModal';
import { useApi } from '../../hooks/useApi';
import * as appointmentsService from '../../services/appointments.service';
import { formatDuration } from '../../utils/duration';

const STATUS_FILTERS = [
  { value: '', label: 'Todas' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'completed', label: 'Atendidas' },
  { value: 'cancelled', label: 'Canceladas' },
  { value: 'no_show', label: 'No asistieron' },
];

/** Una cita ya cerrada no se toca más. */
const CLOSED_STATUSES = ['completed', 'cancelled', 'no_show'];

/**
 * Agenda del panel. Replica el molde de `ProductsManager`: `DataTable` +
 * `ConfirmDialog` + un modal propio, con la convención de estado del modal
 * (`undefined` = cerrado, objeto = trabajando sobre esa fila).
 */
function AppointmentsManager({ canManageStatus = true }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modalAppointment, setModalAppointment] = useState(undefined);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isActing, setIsActing] = useState(false);

  const { data, isLoading, error, refetch } = useApi(
    () =>
      appointmentsService.listAppointments({
        search,
        status,
        perPage: 50,
        orderBy: 'scheduledDate',
        orderDir: 'asc',
      }),
    [search, status],
  );

  const rows = useMemo(() => data ?? [], [data]);

  const handleReschedule = async (values) => {
    await appointmentsService.rescheduleAppointment(modalAppointment.id, values);
    await refetch();
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    setIsActing(true);
    setActionError(null);
    try {
      if (pendingAction.type === 'cancel') {
        await appointmentsService.cancelAppointment(pendingAction.appointment.id);
      } else {
        await appointmentsService.updateAppointmentStatus(
          pendingAction.appointment.id,
          pendingAction.nextStatus,
        );
      }
      await refetch();
      setPendingAction(null);
    } catch (actionFailure) {
      setActionError(actionFailure.message ?? 'No se pudo completar la acción.');
    } finally {
      setIsActing(false);
    }
  };

  const closeActionDialog = () => {
    setPendingAction(null);
    setActionError(null);
  };

  const columns = [
    { key: 'appointmentNumber', header: 'Cita' },
    {
      key: 'customer',
      header: 'Cliente',
      render: (row) => `${row.customerFirstName} ${row.customerLastName}`,
    },
    { key: 'serviceName', header: 'Servicio' },
    {
      key: 'schedule',
      header: 'Fecha y hora',
      render: (row) => (
        <span className="whitespace-nowrap">
          {row.scheduledDate} · {row.startTime} – {row.endTime}
        </span>
      ),
    },
    {
      key: 'duration',
      header: 'Duración',
      render: (row) => formatDuration(row.durationMinutes) ?? '—',
    },
    { key: 'status', header: 'Estado', render: (row) => <AppointmentStatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => {
        const isClosed = CLOSED_STATUSES.includes(row.status);

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Reprogramar la cita ${row.appointmentNumber}`}
              disabled={isClosed}
              onClick={() => setModalAppointment(row)}
            >
              <CalendarClock className="size-4" />
            </Button>

            {canManageStatus && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Marcar como atendida la cita ${row.appointmentNumber}`}
                  disabled={isClosed}
                  onClick={() =>
                    setPendingAction({ type: 'status', appointment: row, nextStatus: 'completed' })
                  }
                >
                  <Check className="size-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Marcar que no asistió a la cita ${row.appointmentNumber}`}
                  disabled={isClosed}
                  onClick={() =>
                    setPendingAction({ type: 'status', appointment: row, nextStatus: 'no_show' })
                  }
                >
                  <UserX className="size-4" />
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              aria-label={`Cancelar la cita ${row.appointmentNumber}`}
              disabled={isClosed}
              onClick={() => setPendingAction({ type: 'cancel', appointment: row })}
            >
              <CalendarX className="size-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold">Agenda de citas</h1>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        error={error}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por cita, cliente o servicio..."
        emptyMessage="No hay citas para mostrar."
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

      <RescheduleModal
        isOpen={modalAppointment !== undefined}
        onClose={() => setModalAppointment(undefined)}
        onSubmit={handleReschedule}
        appointment={modalAppointment}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingAction)}
        onClose={closeActionDialog}
        onConfirm={confirmAction}
        isLoading={isActing}
        error={actionError}
        title={pendingAction?.type === 'cancel' ? 'Cancelar cita' : 'Cambiar estado'}
        confirmLabel={pendingAction?.type === 'cancel' ? 'Cancelar la cita' : 'Confirmar'}
        description={
          pendingAction?.type === 'cancel'
            ? `¿Cancelar la cita ${pendingAction?.appointment.appointmentNumber} de ${pendingAction?.appointment.customerFirstName}? El horario volverá a quedar libre.`
            : `¿Marcar la cita ${pendingAction?.appointment.appointmentNumber} como "${pendingAction?.nextStatus === 'completed' ? 'Atendida' : 'No asistió'}"?`
        }
      />
    </div>
  );
}

export default AppointmentsManager;
