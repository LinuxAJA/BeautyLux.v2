import Badge from '../ui/Badge';

/** Etiqueta y color de cada estado de una cita. */
const STATUS_MAP = {
  hold: { label: 'Reservada', variant: 'muted' },
  confirmed: { label: 'Confirmada', variant: 'soft' },
  completed: { label: 'Atendida', variant: 'gold' },
  cancelled: { label: 'Cancelada', variant: 'muted' },
  no_show: { label: 'No asistió', variant: 'muted' },
};

function AppointmentStatusBadge({ status }) {
  const { label, variant } = STATUS_MAP[status] ?? { label: status, variant: 'muted' };

  return (
    <Badge variant={variant} className={status === 'confirmed' ? 'text-primary' : ''}>
      {label}
    </Badge>
  );
}

export default AppointmentStatusBadge;
