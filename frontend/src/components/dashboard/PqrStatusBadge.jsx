import Badge from '../ui/Badge';

/** Etiqueta y color de cada estado de una PQR. */
const STATUS_MAP = {
  pending: { label: 'Pendiente', variant: 'muted' },
  in_progress: { label: 'En proceso', variant: 'soft' },
  answered: { label: 'Respondida', variant: 'gold' },
  closed: { label: 'Cerrada', variant: 'muted' },
};

function PqrStatusBadge({ status }) {
  const { label, variant } = STATUS_MAP[status] ?? { label: status, variant: 'muted' };

  return (
    <Badge variant={variant} className={status === 'in_progress' ? 'text-primary' : ''}>
      {label}
    </Badge>
  );
}

export default PqrStatusBadge;
