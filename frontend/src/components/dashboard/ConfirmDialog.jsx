import { TriangleAlert } from 'lucide-react';

import Button from '../ui/Button';
import Modal from '../ui/Modal';

/** Confirmación antes de una acción destructiva (eliminar, desactivar...). */
function ConfirmDialog({ isOpen, onClose, onConfirm, title, description, confirmLabel = 'Confirmar', isLoading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          {description}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
