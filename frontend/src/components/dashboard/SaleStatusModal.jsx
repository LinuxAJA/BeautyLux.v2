import { useEffect, useState } from 'react';

import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Select from '../ui/Select';
import { formatPrice } from '../../data/products';

const SALE_STATUS_LABELS = {
  pending: 'Pendiente',
  paid: 'Pagado',
  processing: 'En preparación',
  completed: 'Entregado',
  cancelled: 'Cancelado',
};

// Solo se avanza: una venta no vuelve a "pendiente" una vez pagada. El
// backend además rechaza mover una venta entregada o cancelada.
const NEXT_STATUSES = {
  pending: ['paid', 'cancelled'],
  paid: ['processing', 'completed', 'cancelled'],
  processing: ['completed', 'cancelled'],
};

const STATUS_HINTS = {
  paid: 'Al marcarla como pagada se emite la factura y se envía al cliente por correo con el PDF.',
  cancelled: 'Cancelar devuelve al inventario los productos de la venta. No se puede deshacer.',
  completed: 'Una venta entregada queda cerrada y ya no cambia de estado.',
};

/**
 * Cambio de estado de una venta desde el historial del panel.
 *
 * Es el paso que confirma el pago de las ventas en línea: el checkout las
 * deja en `pending` (el pago es simulado) y el personal las marca como
 * pagadas cuando confirma el cobro, lo que emite la factura.
 */
function SaleStatusModal({ isOpen, onClose, sale, onSave }) {
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const options = (NEXT_STATUSES[sale?.status] ?? []).map((value) => ({
    value,
    label: SALE_STATUS_LABELS[value],
  }));

  useEffect(() => {
    if (isOpen) {
      setStatus(NEXT_STATUSES[sale?.status]?.[0] ?? '');
      setError(null);
    }
  }, [isOpen, sale?.id, sale?.status]);

  if (!sale) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onSave(sale.id, status);
      onClose();
    } catch (saveError) {
      setError(saveError.message ?? 'No se pudo cambiar el estado de la venta.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Venta ${sale.saleNumber}`}
      description={`${sale.customer.firstName} ${sale.customer.lastName} · ${formatPrice(sale.total)}`}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Estado actual:{' '}
          <span className="font-medium text-foreground">{SALE_STATUS_LABELS[sale.status] ?? sale.status}</span>
        </p>

        <Select
          label="Nuevo estado"
          options={options}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        />

        {STATUS_HINTS[status] && (
          <p aria-live="polite" className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
            {STATUS_HINTS[status]}
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant={status === 'cancelled' ? 'destructive' : 'gradient'}
            isLoading={isSaving}
            disabled={!status}
            onClick={handleSave}
          >
            Guardar estado
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default SaleStatusModal;
