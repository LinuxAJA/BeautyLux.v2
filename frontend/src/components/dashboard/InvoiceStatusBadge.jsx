import Badge from '../ui/Badge';

/** Etiqueta y color de cada estado de una factura. */
const STATUS_MAP = {
  issued: { label: 'Emitida', variant: 'soft' },
  paid: { label: 'Pagada', variant: 'gold' },
  void: { label: 'Anulada', variant: 'muted' },
};

function InvoiceStatusBadge({ status }) {
  const { label, variant } = STATUS_MAP[status] ?? { label: status, variant: 'muted' };

  return (
    <Badge variant={variant} className={status === 'issued' ? 'text-primary' : ''}>
      {label}
    </Badge>
  );
}

export default InvoiceStatusBadge;
