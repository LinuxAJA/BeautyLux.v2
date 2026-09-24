import { useMemo, useState } from 'react';
import { CalendarClock, CalendarX } from 'lucide-react';

import Button from '../../../components/ui/Button';
import AppointmentStatusBadge from '../../../components/dashboard/AppointmentStatusBadge';
import ConfirmDialog from '../../../components/dashboard/ConfirmDialog';
import DataTable from '../../../components/dashboard/DataTable';
import RescheduleModal from '../../../components/dashboard/RescheduleModal';
import { useApi } from '../../../hooks/useApi';
import * as appointmentsService from '../../../services/appointments.service';
import { formatDuration } from '../../../utils/duration';

const CLOSED_STATUSES = ['completed', 'cancelled', 'no_show'];

/**
 * "Mis citas" del panel del cliente.
 *
 * Reutiliza el mismo modal de reprogramación del panel del personal: la
 * clienta puede mover o cancelar su cita, y la disponibilidad que ve es la
 * misma que calcula el servidor para todos.
 */
function ClientAppointments() {
  const [search, setSearch] = useState('');
  const [modalAppointment, setModalAppointment] = useState(undefined);
  const [pendingCancel, setPendingCancel] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isActing, setIsActing] = useState(false);

  const { data, isLoading, error, refetch } = useApi(
    () =>
      appointmentsService.listAppointments({
        search,
        perPage: 50,
        orderBy: 'scheduledDate',
        orderDir: 'desc',
      }),
    [search],
  );

  const rows = useMemo(() => data ?? [], [data]);

  const handleReschedule = async (values) => {
    await appointmentsService.rescheduleAppointment(modalAppointment.id, values);
    await refetch();
  };

  const confirmCancel = async () => {
    setIsActing(true);
    setActionError(null);
    try {
      await appointmentsService.cancelAppointment(pendingCancel.id);
      await refetch();
      setPendingCancel(null);
    } catch (cancelError) {
      setActionError(cancelError.message ?? 'No se pudo cancelar la cita.');
    } finally {
      setIsActing(false);
    }
  };

  const columns = [
    { key: 'appointmentNumber', header: 'Cita' },
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
    { key: 'duration', header: 'Duración', render: (row) => formatDuration(row.durationMinutes) ?? '—' },
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
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Cancelar la cita ${row.appointmentNumber}`}
              disabled={isClosed}
              onClick={() => setPendingCancel(row)}
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
      <h1 className="font-serif text-2xl font-semibold">Mis citas</h1>

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        error={error}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por servicio o número de cita..."
        emptyMessage="Todavía no tienes citas agendadas."
      />

      <RescheduleModal
        isOpen={modalAppointment !== undefined}
        onClose={() => setModalAppointment(undefined)}
        onSubmit={handleReschedule}
        appointment={modalAppointment}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingCancel)}
        onClose={() => {
          setPendingCancel(null);
          setActionError(null);
        }}
        onConfirm={confirmCancel}
        isLoading={isActing}
        error={actionError}
        title="Cancelar cita"
        confirmLabel="Cancelar la cita"
        description={`¿Cancelar tu cita de ${pendingCancel?.serviceName} del ${pendingCancel?.scheduledDate} a las ${pendingCancel?.startTime}?`}
      />
    </div>
  );
}

export default ClientAppointments;
