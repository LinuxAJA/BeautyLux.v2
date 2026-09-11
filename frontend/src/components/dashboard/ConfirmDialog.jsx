import { CircleAlert, TriangleAlert } from 'lucide-react';

import Button from '../ui/Button';
import Modal from '../ui/Modal';

/**
 * Confirmación antes de una acción destructiva (eliminar, desactivar...).
 *
 * `error`, si se pasa, se pinta como un banner aparte (no sobrescribe la
 * pregunta de `description`): el diálogo queda abierto para reintentar o
 * cancelar en vez de cerrarse en silencio.
 */
function ConfirmDialog({ isOpen, onClose, onConfirm, title, description, confirmLabel = 'Confirmar', isLoading, error }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          {description}
        </p>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

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
